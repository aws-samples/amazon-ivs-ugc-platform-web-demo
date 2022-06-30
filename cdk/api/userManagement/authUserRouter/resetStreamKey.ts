import {
  ChannelNotBroadcasting,
  CreateStreamKeyCommand,
  DeleteStreamKeyCommand,
  StopStreamCommand
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser, ivsClient, updateDynamoUserAttributes } from '../helpers';
import { RESET_STREAM_KEY_EXCEPTION } from '../../utils/constants';
import { ResponseBody } from '../../utils';
import { UserContext } from './authorizer';

interface ResetStreamKeyResponseBody extends ResponseBody {
  streamKeyValue?: string;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: ResetStreamKeyResponseBody = {};
  let newStreamKeyArn;
  let newStreamKeyValue;

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn },
      streamKeyArn: { S: streamKeyArn }
    } = Item;

    // First stop the stream if it's running
    const stopStreamCommand = new StopStreamCommand({ channelArn });

    try {
      await ivsClient.send(stopStreamCommand);
    } catch (error) {
      // Error out silently if the channel is not currently live
      if (!(error instanceof ChannelNotBroadcasting)) {
        throw error;
      }
    }

    // Delete the existing key
    const deleteStreamKeyCommand = new DeleteStreamKeyCommand({
      arn: streamKeyArn
    });

    await ivsClient.send(deleteStreamKeyCommand);

    // Create a new key
    const createStreamKeyCommand = new CreateStreamKeyCommand({ channelArn });
    const { streamKey } = await ivsClient.send(createStreamKeyCommand);

    newStreamKeyArn = streamKey?.arn;
    newStreamKeyValue = streamKey?.value;

    if (!newStreamKeyArn || !newStreamKeyValue) {
      throw new Error(
        `Missing values in the IVS response:\nnewStreamKeyArn: ${newStreamKeyArn}\nnewStreamKeyValue: ${newStreamKeyValue}`
      );
    }

    // Update Dynamo user entry
    await updateDynamoUserAttributes(sub, [
      { key: 'streamKeyArn', value: newStreamKeyArn },
      { key: 'streamKeyValue', value: newStreamKeyValue }
    ]);

    responseBody.streamKeyValue = newStreamKeyValue;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: RESET_STREAM_KEY_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
