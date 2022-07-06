import { ChannelType, CreateChannelCommand } from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { dynamoDbClient, getUser, ivsClient } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { updateDynamoItemAttributes } from '../../shared/helpers';
import { UserContext } from '../authorizer';

type CreateResourcesRequestBody = { email: string | undefined };

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { email } = request.body as CreateResourcesRequestBody;

  try {
    if (!email) {
      throw new Error(`Missing email for user: ${username}`);
    }

    const { Item } = await getUser(sub);

    // If the user resources already exists, no need to create them again
    if (Item?.channelArn?.S) {
      return reply.send({});
    }

    // Create IVS channel
    const cleanedUserName = username.replace(/[^a-zA-Z0-9-_]/g, '');
    const channelName = `${cleanedUserName}s-channel`;
    const createChannelCommand = new CreateChannelCommand({
      name: channelName,
      type: process.env.IVS_CHANNEL_TYPE as ChannelType
    });
    let channelArn;
    let ingestEndpoint;
    let streamKeyArn;
    let streamKeyValue;
    let playbackUrl;

    const { channel, streamKey } = await ivsClient.send(createChannelCommand);
    channelArn = channel?.arn;
    ingestEndpoint = channel?.ingestEndpoint;
    streamKeyValue = streamKey?.value;
    streamKeyArn = streamKey?.arn;
    playbackUrl = channel?.playbackUrl;

    if (
      !channelArn ||
      !ingestEndpoint ||
      !streamKeyArn ||
      !streamKeyValue ||
      !playbackUrl
    ) {
      throw new Error(
        `Missing values in the IVS response:\nchannelArn: ${channelArn}\ningestEndpoint: ${ingestEndpoint}\nstreamKeyArn: ${streamKeyArn}\nstreamKeyValue: ${streamKeyValue}\nplaybackUrl: ${playbackUrl}`
      );
    }

    // Update the entry in the user table
    await updateDynamoItemAttributes({
      attributes: [
        { key: 'channelArn', value: channelArn },
        { key: 'ingestEndpoint', value: `rtmps://${ingestEndpoint}:443/app/` },
        { key: 'playbackUrl', value: playbackUrl },
        { key: 'streamKeyArn', value: streamKeyArn },
        { key: 'streamKeyValue', value: streamKeyValue }
      ],
      dynamoDbClient,
      id: sub,
      tableName: process.env.USER_TABLE_NAME as string
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 201;

  return reply.send({});
};

export default handler;
