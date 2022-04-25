import {
  ChannelType,
  CreateChannelCommand,
  IvsClient
} from '@aws-sdk/client-ivs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser } from '../utils/userManagementHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';
import { UserContext } from './authorizer';

const ivsClient = new IvsClient({});
const dynamoDbClient = new DynamoDBClient({});

type CreateResourcesRequestBody = { email: string | undefined };

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { email } = request.body as CreateResourcesRequestBody;

  try {
    if (!email) {
      throw new Error(`Missing email for user: ${username}`);
    }

    const { Item } = await getUser(sub);

    // User already exists, no need to create resources again
    if (Item) {
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
    // Create entry in the user table
    const putItemCommand = new PutItemCommand({
      Item: {
        channelArn: { S: channelArn },
        email: { S: email },
        id: { S: sub },
        ingestEndpoint: { S: `rtmps://${ingestEndpoint}:443/app/` },
        playbackUrl: { S: playbackUrl },
        streamKeyArn: { S: streamKeyArn },
        streamKeyValue: { S: streamKeyValue },
        username: { S: username }
      },
      TableName: process.env.USER_TABLE_NAME
    });

    await dynamoDbClient.send(putItemCommand);
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 201;

  return reply.send({});
};

export default handler;
