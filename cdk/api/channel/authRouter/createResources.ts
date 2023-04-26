import { ChannelType, CreateChannelCommand } from '@aws-sdk/client-ivs';
import { CreateRoomCommand } from '@aws-sdk/client-ivschat';
import { FastifyReply, FastifyRequest } from 'fastify';

import { generateDeterministicId, getUser } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import {
  ivsChatClient,
  ivsClient,
  updateDynamoItemAttributes,
  getChannelId
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
      type: process.env.IVS_CHANNEL_TYPE as ChannelType,
      tags: { project: process.env.PROJECT_TAG as string }
    });
    const { channel, streamKey } = await ivsClient.send(createChannelCommand);

    // Create IVS chat room
    const createRoomCommand = new CreateRoomCommand({
      name: `${cleanedUserName}s-room`,
      tags: { project: process.env.PROJECT_TAG as string }
    });
    const chatRoom = await ivsChatClient.send(createRoomCommand);

    const channelArn = channel?.arn;
    const ingestEndpoint = channel?.ingestEndpoint;
    const streamKeyValue = streamKey?.value;
    const streamKeyArn = streamKey?.arn;
    const playbackUrl = channel?.playbackUrl;
    const chatRoomArn = chatRoom.arn;

    let trackingId;

    if (channelArn) {
      const channelId = getChannelId(channelArn);
      trackingId =
        channelId +
        (process.env.PRODUCT_LINK_REGION_CODE
          ? `-${process.env.PRODUCT_LINK_REGION_CODE}`
          : '');
    }

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

    // Update the entry in the channels table
    await updateDynamoItemAttributes({
      attributes: [
        { key: 'channelArn', value: channelArn },
        { key: 'channelAssetId', value: generateDeterministicId(sub) },
        { key: 'channelAssets', value: {} },
        { key: 'chatRoomArn', value: chatRoomArn },
        { key: 'ingestEndpoint', value: ingestEndpoint },
        { key: 'playbackUrl', value: playbackUrl },
        { key: 'streamKeyArn', value: streamKeyArn },
        { key: 'streamKeyValue', value: streamKeyValue },
        { key: 'trackingId', value: trackingId }
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
