import { v4 as uuidv4 } from 'uuid';
import {
  CreateParticipantTokenCommand,
  CreateParticipantTokenCommandInput,
  CreateStageCommand,
  CreateStageCommandInput,
  DeleteStageCommand,
  GetStageCommand,
  IVSRealTimeClient,
  ListParticipantsCommand,
  ListParticipantsCommandInput,
  ParticipantSummary,
  DisconnectParticipantCommand
} from '@aws-sdk/client-ivs-realtime';
import {
  ChannelAssets,
  dynamoDbClient,
  getChannelAssetUrls,
  getChannelId,
  updateDynamoItemAttributes
} from '../shared/helpers';
import {
  ALLOWED_CHANNEL_ASSET_TYPES,
  CHANNELS_TABLE_STAGE_FIELDS,
  CUSTOM_AVATAR_NAME,
  RESOURCE_NOT_FOUND_EXCEPTION,
  STAGE_TOKEN_DURATION
} from '../shared/constants';
import { getUser } from '../channel/helpers';
import { ParticipantTokenCapability } from '@aws-sdk/client-ivs-realtime';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryCommand } from '@aws-sdk/client-dynamodb';

export const USER_STAGE_ID_SEPARATOR = ':stage/';

interface HandleCreateStageParams {
  userSub?: string;
  participantType: string;
  isHostInStage?: boolean;
}

const CHANNEL_ASSET_AVATAR_DELIMITER = 'https://';

const STAGE_CONNECTION_STATES = {
  CONNECTED: 'CONNECTED'
};

export enum PARTICIPANT_TYPES {
  HOST = 'host',
  SPECTATOR = 'spectator',
  INVITED = 'invited',
  REQUESTED = 'requested'
}

export const PARTICIPANT_USER_TYPES = {
  HOST: 'host',
  SPECTATOR: 'spectator',
  INVITED: 'invited',
  REQUESTED: 'requested'
};

const PARTICIPANT_CONNECTION_STATES = {
  CONNECTED: 'CONNECTED'
};

const shouldFetchUserData = [
  PARTICIPANT_USER_TYPES.HOST,
  PARTICIPANT_USER_TYPES.INVITED,
  PARTICIPANT_USER_TYPES.REQUESTED
];

export type ParticipantType =
  | PARTICIPANT_TYPES.HOST
  | PARTICIPANT_TYPES.SPECTATOR
  | PARTICIPANT_TYPES.INVITED
  | PARTICIPANT_TYPES.REQUESTED;

const client = new IVSRealTimeClient({});

export const extractStageIdfromStageArn = (
  userStageArn: string | undefined
) => {
  if (!userStageArn) return '';
  return userStageArn.split(USER_STAGE_ID_SEPARATOR)[1];
};

export const handleCreateStage = async (input: CreateStageCommandInput) => {
  const command = new CreateStageCommand(input);
  const { participantTokens, stage } = await client.send(command);

  const token = participantTokens?.[0].token;
  const stageId = extractStageIdfromStageArn(stage?.arn);

  return {
    token,
    stageId
  };
};

export const handleDeleteStage = async (stageId: string) => {
  const stageArn = buildStageArn(stageId);

  const deleteStageCommand = new DeleteStageCommand({ arn: stageArn });

  await client.send(deleteStageCommand);
};

export const handleCreateParticipantToken = async (
  input: CreateParticipantTokenCommandInput
) => {
  try {
    const command = new CreateParticipantTokenCommand(input);
    const { participantToken } = await client.send(command);

    return participantToken?.token;
  } catch (err) {
    throw new Error('Failed to create token');
  }
};

export const buildStageArn = (stageId: string) =>
  `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}${USER_STAGE_ID_SEPARATOR}${stageId}`;

const updateHostChannelTable = async (hostChannelArn: string) => {
  const queryCommand = new QueryCommand({
    TableName: process.env.CHANNELS_TABLE_NAME,
    IndexName: 'channelArnIndex',
    KeyConditionExpression: 'channelArn = :channelArn',
    ExpressionAttributeValues: {
      ':channelArn': convertToAttr(hostChannelArn)
    }
  });
  const { Items = [] } = await dynamoDbClient.send(queryCommand);
  const { id } = unmarshall(Items[0]);
  await updateDynamoItemAttributes({
    attributes: [
      { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID, value: null },
      {
        key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE,
        value: null
      }
    ],
    primaryKey: { key: 'id', value: id },
    tableName: process.env.CHANNELS_TABLE_NAME as string
  });
};

export const getStage = async (stageId: string, hostChannelArn?: string) => {
  try {
    const stageArn = buildStageArn(stageId);

    const getStageCommand = new GetStageCommand({ arn: stageArn });
    const stage = await client.send(getStageCommand);

    return stage;
  } catch (err: unknown) {
    const { name } = err as Error;
    if (name === RESOURCE_NOT_FOUND_EXCEPTION && hostChannelArn) {
      try {
        await updateHostChannelTable(hostChannelArn);
      } catch (err) {
        throw new Error('Failed to update host channel table.');
      }
    }

    throw new Error('Failed to retrieve stage information.');
  }
};

export const getChannelAssetAvatarURL = (
  channelAssets: ChannelAssets,
  avatar: string
) => {
  const channelAssetsAvatarUrl: string | undefined =
    getChannelAssetUrls(channelAssets)?.[ALLOWED_CHANNEL_ASSET_TYPES[0]];

  return avatar === CUSTOM_AVATAR_NAME && !!channelAssetsAvatarUrl
    ? channelAssetsAvatarUrl.split(CHANNEL_ASSET_AVATAR_DELIMITER)[1]
    : '';
};

export const handleCreateStageParams = async ({
  userSub,
  participantType,
  isHostInStage = false
}: HandleCreateStageParams) => {
  const shouldCreateHostUserType =
    participantType === PARTICIPANT_USER_TYPES.HOST && !isHostInStage;

  let username,
    profileColor,
    avatar,
    channelAssets,
    channelArn,
    channelId = '',
    channelAssetsAvatarUrlPath = '';

  if (userSub && shouldFetchUserData.includes(participantType)) {
    const { Item: UserItem = {} } = await getUser(userSub);
    ({
      avatar,
      color: profileColor,
      channelAssets,
      username,
      channelArn
    } = unmarshall(UserItem));

    if (channelArn) {
      channelId = getChannelId(channelArn);
    }

    channelAssetsAvatarUrlPath = getChannelAssetAvatarURL(
      channelAssets,
      avatar
    );
  }

  const capabilities =
    participantType === PARTICIPANT_USER_TYPES.SPECTATOR
      ? [ParticipantTokenCapability.SUBSCRIBE]
      : [
          ParticipantTokenCapability.PUBLISH,
          ParticipantTokenCapability.SUBSCRIBE
        ];

  const userId = shouldCreateHostUserType
    ? generateHostUserId(channelArn)
    : uuidv4();

  let userType = shouldCreateHostUserType
    ? PARTICIPANT_USER_TYPES.HOST
    : PARTICIPANT_USER_TYPES.INVITED;
  if (participantType === PARTICIPANT_USER_TYPES.SPECTATOR) {
    userType = PARTICIPANT_USER_TYPES.SPECTATOR;
  } else if (participantType === PARTICIPANT_USER_TYPES.REQUESTED) {
    userType = PARTICIPANT_USER_TYPES.REQUESTED;
  }

  return {
    username,
    profileColor,
    avatar,
    channelAssetsAvatarUrlPath,
    duration: STAGE_TOKEN_DURATION,
    userId,
    capabilities,
    userType,
    channelId
  };
};

// participants
const listParticipants = async (input: ListParticipantsCommandInput) => {
  const listParticipantsCommand = new ListParticipantsCommand(input);

  return await client.send(listParticipantsCommand);
};

export const generateHostUserId = (channelArn: string) => {
  const channelId = getChannelId(channelArn);

  return `${PARTICIPANT_USER_TYPES.HOST}:${channelId}`;
};

export const isUserInStage = async (stageId: string, userSub: string) => {
  const { Item: UserItem = {} } = await getUser(userSub);
  const { channelArn } = unmarshall(UserItem);
  const { stage } = await getStage(stageId, channelArn);
  const hostUserId = generateHostUserId(channelArn);
  const stageArn = buildStageArn(stageId);

  if (!stage?.activeSessionId) return false;

  const { participants } = await listParticipants({
    stageArn,
    sessionId: stage?.activeSessionId,
    filterByUserId: hostUserId
  });

  if (!participants) return false;

  return participants.some(
    ({ state }) => state === PARTICIPANT_CONNECTION_STATES.CONNECTED
  );
};

export const isStageActive = async (stageId: string) => {
  const { stage } = await getStage(stageId);

  return !!stage?.activeSessionId;
};

const getNumberOfParticipantsInStage = (
  participants: ParticipantSummary[] | undefined
) => {
  if (!participants) return 0;

  const participantList = new Set();
  const participantIds = new Map();

  for (const participant of participants) {
    const { participantId } = participant;
    if (!participantIds.has(participantId)) {
      participantIds.set(participantId, true);
      participantList.add(participant);
    }
  }

  return participantList.size;
};

export const shouldAllowParticipantToJoin = async (stageId: string) => {
  const { stage } = await getStage(stageId);
  const stageArn = buildStageArn(stageId);

  if (!stage?.activeSessionId) {
    throw new Error('Stage is not active');
  }

  const { participants } = await listParticipants({
    stageArn,
    sessionId: stage?.activeSessionId,
    filterByPublished: true
  });

  const isHostInStage = participants?.find(
    (participant) =>
      participant.userId?.includes(PARTICIPANT_USER_TYPES.HOST) &&
      participant.state === STAGE_CONNECTION_STATES.CONNECTED
  );

  if (!isHostInStage) {
    const numberOfParticipantInStage =
      getNumberOfParticipantsInStage(participants);

    // save the last spot for the host
    if (numberOfParticipantInStage >= 11) {
      return false;
    }
  }

  return true;
};

export const validateRequestParams = (...requestParams: string[]) => {
  let misssingParams: string[] = [];

  requestParams.forEach((paramName) => {
    if (
      paramName === 'undefined' ||
      paramName === 'null' ||
      paramName.trim() === ''
    ) {
      misssingParams.push(paramName);
    }
  });

  return (
    misssingParams.length &&
    misssingParams.join(misssingParams.length > 1 ? ', ' : '')
  );
};

export const verifyUserIsStageHost = async (sub: string) => {
  const { Item: UserItem = {} } = await getUser(sub);
  const { stageId = null, channelArn } = unmarshall(UserItem);
  if (!stageId) {
    throw new Error('No active stage found.');
  }

  const { stage } = await getStage(stageId);
  const channelId = getChannelId(channelArn);
  const stageOwnerChannelId = stage?.tags?.stageOwnerChannelId;
  const isStageHost = stageOwnerChannelId === channelId;

  if (!isStageHost) {
    throw new Error('Channel ownership verification failed.');
  }

  return {
    isStageHost,
    stageId
  };
};

export const handleDisconnectParticipant = async (
  participantId: string,
  stageId: string
) => {
  const stageArn = buildStageArn(stageId);

  const disconnectParticipantCommand = new DisconnectParticipantCommand({
    participantId,
    stageArn,
    reason: 'You have been kicked by the host.'
  });

  await client.send(disconnectParticipantCommand);
};
