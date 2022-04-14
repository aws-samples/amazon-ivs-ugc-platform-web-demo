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
} from '../utils/constants';

const ivsClient = new IvsClient({});
const dynamoDbClient = new DynamoDBClient({});

export const handler: PostAuthenticationTriggerHandler = async (event) => {
  const { request, userName } = event;
  const { email, sub } = request.userAttributes;

  if (!email || !userName) {
    console.error(`Invalid input:\nemail: ${email}\nuserName: ${userName}\n`);

    throw new Error(INVALID_INPUT_ERROR);
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
  let streamKeyArn;
  let streamKeyValue;
  let playbackUrl;

  try {
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
  } catch (error) {
    console.error(error);

    throw new Error(CHANNEL_CREATION_ERROR);
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
      username: { S: userName }
    },
    TableName: process.env.USER_TABLE_NAME
  });

  try {
    await dynamoDbClient.send(putItemCommand);
  } catch (error) {
    console.error(error);

    throw new Error(USER_CREATION_ERROR);
  }

  return event;
};
