import { ChannelType, CreateChannelCommand } from '@aws-sdk/client-ivs';
import { CreateRoomCommand } from '@aws-sdk/client-ivschat';
import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import {
  ivsChatClient,
  ivsClient,
  updateDynamoItemAttributes
} from '../../shared/helpers';
import { UserContext } from '../authorizer';

type CreateResourcesRequestBody = { email: string | undefined };

const handler = async (
  request: FastifyRequest<{ Body: CreateResourcesRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { email } = request.body;

  try {
    if (!email) {
      throw new Error(`Missing email for user: ${username}`);
    }

    const { Item } = await getUser(sub);

    // If the user resources already exist, no need to create them again
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

    // Create IVS chat room
    const createRoomCommand = new CreateRoomCommand({
      name: `${cleanedUserName}s-room`
    });

    let channelArn,
      ingestEndpoint,
      streamKeyArn,
      streamKeyValue,
      playbackUrl,
      chatRoomArn;

    const { channel, streamKey } = await ivsClient.send(createChannelCommand);
    const chatRoom = await ivsChatClient.send(createRoomCommand);
    channelArn = channel?.arn;
    ingestEndpoint = channel?.ingestEndpoint;
    streamKeyValue = streamKey?.value;
    streamKeyArn = streamKey?.arn;
    playbackUrl = channel?.playbackUrl;
    chatRoomArn = chatRoom.arn;

    if (
      !channelArn ||
      !ingestEndpoint ||
      !streamKeyArn ||
      !streamKeyValue ||
      !playbackUrl ||
      !chatRoomArn
    ) {
      throw new Error(
        `Missing values in the IVS response:\nchannelArn: ${channelArn}\ningestEndpoint: ${ingestEndpoint}\nstreamKeyArn: ${streamKeyArn}\nstreamKeyValue: ${streamKeyValue}\nplaybackUrl: ${playbackUrl}\chatRoomArn: ${chatRoomArn}`
      );
    }

    // Update the entry in the user table
    await updateDynamoItemAttributes({
      attributes: [
        { key: 'channelArn', value: channelArn },
        { key: 'ingestEndpoint', value: `rtmps://${ingestEndpoint}:443/app/` },
        { key: 'playbackUrl', value: playbackUrl },
        { key: 'streamKeyArn', value: streamKeyArn },
        { key: 'streamKeyValue', value: streamKeyValue },
        { key: 'chatRoomArn', value: chatRoomArn }
      ],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME as string
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
