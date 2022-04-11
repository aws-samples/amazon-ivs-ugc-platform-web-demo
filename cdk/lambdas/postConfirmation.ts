import {
  ChannelType,
  CreateChannelCommand,
  IvsClient
} from '@aws-sdk/client-ivs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PostAuthenticationTriggerHandler } from 'aws-lambda';

import {
  CHANNEL_CREATION_ERROR,
  INVALID_INPUT_ERROR,
  USER_CREATION_ERROR
} from './constants';

const ivsClient = new IvsClient({});
const dynamoDbClient = new DynamoDBClient({});

export const handler: PostAuthenticationTriggerHandler = async (
  event,
  _context,
  callback
) => {
  const { request, userName } = event;
  const { email, sub } = request.userAttributes;

  if (!email || !userName) {
    console.error(`Invalid input:\nemail: ${email}\nuserName: ${userName}\n`);

    return callback(new Error(INVALID_INPUT_ERROR), null);
  }

  // Create IVS channel
  const cleanedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '');
  const channelName = `${cleanedUserName}s-channel`;
  const createChannelCommand = new CreateChannelCommand({
    name: channelName,
    type: process.env.IVS_CHANNEL_TYPE as ChannelType
  });
  let channelArn;
  let ingestEndpoint;
  let streamKeyValue;
  let playbackUrl;

  try {
    const { channel, streamKey } = await ivsClient.send(createChannelCommand);
    channelArn = channel?.arn;
    ingestEndpoint = channel?.ingestEndpoint;
    streamKeyValue = streamKey?.value;
    playbackUrl = channel?.playbackUrl;

    if (!channelArn || !ingestEndpoint || !streamKeyValue || !playbackUrl) {
      throw new Error(
        `Missing values in the IVS response:\nchannelArn: ${channelArn}\ningestEndpoint: ${ingestEndpoint}\nstreamKeyValue: ${ingestEndpoint}\nplaybackUrl: ${playbackUrl}`
      );
    }
  } catch (error) {
    console.error(error);

    return callback(new Error(CHANNEL_CREATION_ERROR), null);
  }

  // Create entry in the user table
  const putItemCommand = new PutItemCommand({
    Item: {
      channelArn: { S: channelArn },
      email: { S: email },
      id: { S: sub },
      ingestEndpoint: { S: `rtmps://${ingestEndpoint}:443/app/` },
      playbackUrl: { S: playbackUrl },
      streamKeyValue: { S: streamKeyValue }
    },
    TableName: process.env.USER_TABLE_NAME
  });

  try {
    await dynamoDbClient.send(putItemCommand);
  } catch (error) {
    console.error(error);

    return callback(new Error(USER_CREATION_ERROR), null);
  }

  return callback(null, event);
};
