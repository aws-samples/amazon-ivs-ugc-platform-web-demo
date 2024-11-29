import {
  ChannelType,
  UpdateChannelCommand,
  TranscodePreset,
  MultitrackInputConfiguration
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import {
  areObjectsSame,
  ChannelConfiguration,
  getMultitrackChannelInputFields,
  getUser
} from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { ivsClient, updateDynamoItemAttributes } from '../../shared/helpers';
import { UserContext } from '../../shared/authorizer';

const cdkMultitrackInputConfiguration: MultitrackInputConfiguration =
  JSON.parse(process.env.CHANNEL_MULTITRACK_INPUT_CONFIGURATION || '{}');

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;

  try {
    const { Item = {} } = await getUser(sub);
    const userData = unmarshall(Item);
    const cdkChannelConfiguration: ChannelConfiguration = {
      type: process.env.IVS_CHANNEL_TYPE as ChannelType,
      multitrackInputConfiguration: cdkMultitrackInputConfiguration
    };
    if (
      userData &&
      areObjectsSame(userData.channelConfiguration, cdkChannelConfiguration)
    ) {
      reply.statusCode = 204;

      return reply.send({
        message: 'Channel configuration is already up to date'
      });
    }

    const { containerFormat, multitrackInputConfiguration } =
      getMultitrackChannelInputFields();

    const updateChannelCommand = new UpdateChannelCommand({
      arn: userData.channelArn,
      type: process.env.IVS_CHANNEL_TYPE as ChannelType,
      preset: process.env
        .IVS_ADVANCED_CHANNEL_TRANSCODE_PRESET as TranscodePreset,
      containerFormat,
      multitrackInputConfiguration
    });
    const { channel } = await ivsClient.send(updateChannelCommand);

    // Update the "channelConfiguration" field in the channel record
    await updateDynamoItemAttributes({
      attributes: [
        {
          key: 'channelConfiguration',
          value: {
            type: channel?.type,
            multitrackInputConfiguration: channel?.multitrackInputConfiguration
          }
        }
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
