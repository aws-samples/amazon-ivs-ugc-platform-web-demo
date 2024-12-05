import { v4 as uuidv4 } from 'uuid';
import {
  CreateParticipantTokenCommand,
  CreateParticipantTokenCommandInput,
  CreateStageCommand,
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
  getUserByChannelArn,
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
import { AttributeValue, QueryCommand } from '@aws-sdk/client-dynamodb';
import { buildChannelArn } from '../metrics/helpers';

export const USER_STAGE_ID_SEPARATOR = ':stage/';

const HOST_USER_ID = {
  PREFIX: 'host:',
  SUFFIX: `/${process.env.PROJECT_TAG}`
};

interface HandleCreateStageParams {
  userSub?: string;
  participantType: string;
  isHostInStage?: boolean;
  channelData?: Record<string, AttributeValue>;
}

export interface HostData {
  username: AttributeValue | null;
  status: STAGE_CONNECTION_STATES;
}

enum STAGE_CONNECTION_STATES {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTED = 'CONNECTED'
}

export enum PARTICIPANT_TYPES {
  HOST = 'host',
  SPECTATOR = 'spectator',
  INVITED = 'invited',
  REQUESTED = 'requested',
  SCREENSHARE = 'screenshare'
}

export const PARTICIPANT_USER_TYPES = {
  HOST: 'host',
  SPECTATOR: 'spectator',
  INVITED: 'invited',
  REQUESTED: 'requested',
  SCREENSHARE: 'screenshare'
};

export const PARTICIPANT_GROUP = {
  USER: 'user',
  DISPLAY: 'display'
};

const PARTICIPANT_CONNECTION_STATES = {
  CONNECTED: 'CONNECTED'
};

const shouldFetchUserData = [
  PARTICIPANT_USER_TYPES.HOST,
  PARTICIPANT_USER_TYPES.INVITED,
  PARTICIPANT_USER_TYPES.REQUESTED,
  PARTICIPANT_USER_TYPES.SCREENSHARE
];

export const participantTypesArray = [
  PARTICIPANT_USER_TYPES.HOST,
  PARTICIPANT_USER_TYPES.INVITED,
  PARTICIPANT_USER_TYPES.REQUESTED
];

export type ParticipantType =
  | PARTICIPANT_TYPES.HOST
  | PARTICIPANT_TYPES.SPECTATOR
  | PARTICIPANT_TYPES.INVITED
  | PARTICIPANT_TYPES.REQUESTED
  | PARTICIPANT_TYPES.SCREENSHARE;

const client = new IVSRealTimeClient({});

export const extractStageIdfromStageArn = (
  userStageArn: string | undefined
) => {
  if (!userStageArn) return '';
  return userStageArn.split(USER_STAGE_ID_SEPARATOR)[1];
};

export const handleCreateStage = async ({
  username,
  profileColor,
  avatar,
  channelAssetsAvatarUrl,
  channelArn,
  sub
}: {
  username: string;
  profileColor: string;
  avatar: string;
  channelAssetsAvatarUrl: string;
  channelArn: string;
  sub: string;
}) => {
  const channelId = getChannelId(channelArn);
  const stageCreationDate = Date.now().toString();
  const sharedAttrParams = {
    username,
    profileColor,
    avatar,
    channelAssetsAvatarUrl,
    channelId
  };
  const participantTokenConfigurations = [
    {
      attributes: {
        ...sharedAttrParams,
        type: PARTICIPANT_USER_TYPES.HOST,
        participantGroup: PARTICIPANT_GROUP.USER
      },
      capabilities: [
        ParticipantTokenCapability.PUBLISH,
        ParticipantTokenCapability.SUBSCRIBE
      ],
      duration: STAGE_TOKEN_DURATION,
      userId: createHostUserIdFromChannelArn(channelArn)
    },
    {
      attributes: {
        ...sharedAttrParams,
        type: PARTICIPANT_USER_TYPES.SCREENSHARE,
        participantGroup: PARTICIPANT_GROUP.DISPLAY
      },
      capabilities: [
        ParticipantTokenCapability.PUBLISH,
        ParticipantTokenCapability.SUBSCRIBE
      ],
      duration: STAGE_TOKEN_DURATION,
      userId: uuidv4()
    }
  ];
  const createStageCommandInput = {
    name: `${username}-${uuidv4()}`,
    participantTokenConfigurations,
    tags: {
      creationDate: stageCreationDate,
      stageOwnerChannelId: channelId,
      project: process.env.PROJECT_TAG as string
    }
  };

  try {
    const command = new CreateStageCommand(createStageCommandInput);
    const { participantTokens, stage } = await client.send(command);

    if (!participantTokens || !stage)
      throw new Error('Failed to create stage resource.');

    const stageConfig = participantTokens.reduce(
      (acc, { token, participantId, attributes }) => {
        const participantGroup = attributes?.participantGroup;

        if (
          participantGroup &&
          Object.values(PARTICIPANT_GROUP).includes(participantGroup)
        ) {
          return {
            ...acc,
            [participantGroup]: {
              token,
              participantId,
              participantGroup
            }
          };
        }

        return acc;
      },
      {}
    );

    const stageId = extractStageIdfromStageArn(stage?.arn);

    console.log(
      `HANDLE CREATE STAGE: Stage resource, with stageId "${stageId}", successfully created.`
    );

    await updateDynamoItemAttributes({
      attributes: [
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID,
          value: stageId
        },
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE,
          value: stageCreationDate
        }
      ],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME as string
    });

    console.log('HANDLE CREATE STAGE: successfully updated channels table');

    return {
      ...stageConfig,
      stageId
    };
  } catch (error) {
    console.error(error);
    throw new Error(
      "[HELPER: handleCreateStage] Failed to create stage resources and update channel's table."
    );
  }
};

export const handleCreateParticipantToken = async (
  input: CreateParticipantTokenCommandInput,
  shouldThrowError = true
) => {
  let response = {
    token: null as string | null,
    participantId: null as string | null
  };
  try {
    const command = new CreateParticipantTokenCommand(input);
    const { participantToken = null } = await client.send(command);

    response = {
      token: participantToken?.token ?? null,
      participantId: participantToken?.participantId ?? null
    };
  } catch (err) {
    console.error(err);
    if (shouldThrowError) throw new Error('Failed to create token');
  }
  return response;
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
    if (name === RESOURCE_NOT_FOUND_EXCEPTION) {
      if (hostChannelArn) {
        try {
          await updateHostChannelTable(hostChannelArn);
        } catch (err) {
          throw new Error('Failed to update host channel table.');
        }
      } else {
        throw err;
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
    ? channelAssetsAvatarUrl
    : '';
};

export const handleCreateStageParams = async ({
  userSub,
  participantType,
  isHostInStage = false,
  channelData
}: HandleCreateStageParams) => {
  const shouldCreateHostUserType =
    participantType === PARTICIPANT_USER_TYPES.HOST && !isHostInStage;

  let username,
    profileColor,
    avatar,
    channelAssets,
    channelArn,
    channelId = '',
    channelAssetsAvatarUrl = '',
    stageId = null;

  if (userSub && shouldFetchUserData.includes(participantType)) {
    let UserItem = {};
    if (channelData) {
      ({ Item: UserItem = {} } = await getUser(userSub));
    }

    ({
      avatar,
      color: profileColor,
      channelAssets,
      username,
      channelArn,
      stageId
    } = unmarshall(UserItem));

    if (channelArn) {
      channelId = getChannelId(channelArn);
    }

    channelAssetsAvatarUrl = getChannelAssetAvatarURL(channelAssets, avatar);
  }

  const capabilities =
    participantType === PARTICIPANT_USER_TYPES.SPECTATOR
      ? [ParticipantTokenCapability.SUBSCRIBE]
      : [
          ParticipantTokenCapability.PUBLISH,
          ParticipantTokenCapability.SUBSCRIBE
        ];

  let userType;

  if (shouldCreateHostUserType) {
    userType = PARTICIPANT_USER_TYPES.HOST;
  } else {
    switch (participantType) {
      case PARTICIPANT_USER_TYPES.SPECTATOR:
      case PARTICIPANT_USER_TYPES.SCREENSHARE:
      case PARTICIPANT_USER_TYPES.REQUESTED:
        userType = participantType;
        break;
      default:
        userType = PARTICIPANT_USER_TYPES.INVITED;
    }
  }

  return {
    username,
    profileColor,
    avatar,
    channelAssetsAvatarUrl,
    duration: STAGE_TOKEN_DURATION,
    userId: uuidv4(),
    capabilities,
    userType,
    channelId,
    channelArn,
    stageId
  };
};

// participants
const listParticipants = async (input: ListParticipantsCommandInput) => {
  const listParticipantsCommand = new ListParticipantsCommand(input);

  return await client.send(listParticipantsCommand);
};

export const createHostUserIdFromChannelId = (channelId: string) =>
  `${HOST_USER_ID.PREFIX}${channelId}${HOST_USER_ID.SUFFIX}`;

export const createHostUserIdFromChannelArn = (channelArn: string) => {
  const channelId = getChannelId(channelArn);

  return createHostUserIdFromChannelId(channelId);
};

export const isUserInStage = async (stageId: string, userSub: string) => {
  const { Item: UserItem = {} } = await getUser(userSub);
  const { channelArn } = unmarshall(UserItem);
  const { stage } = await getStage(stageId, channelArn);
  const hostUserId = createHostUserIdFromChannelArn(channelArn);
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
    const { participantId, state } = participant;
    if (
      !participantIds.has(participantId) &&
      state === PARTICIPANT_CONNECTION_STATES.CONNECTED
    ) {
      participantIds.set(participantId, true);
      participantList.add(participant);
    }
  }

  return participantList.size;
};

export const extractChannelIdFromUserId = (stageUserId: string | undefined) =>
  stageUserId?.split(HOST_USER_ID.PREFIX)[1]?.split(HOST_USER_ID.SUFFIX)[0] ??
  undefined;

export const getStageHostDataAndSize = async (stageId: string) => {
  let hostData: HostData = {
    username: null,
    status: STAGE_CONNECTION_STATES.DISCONNECTED
  };

  const { stage } = await getStage(stageId);
  const stageArn = buildStageArn(stageId);

  if (!stage?.activeSessionId) {
    throw new Error('Stage is not active');
  }

  const { participants = [] } = await listParticipants({
    stageArn,
    sessionId: stage?.activeSessionId,
    filterByPublished: true
  });

  const [connectedHost] = participants.filter(
    (participant) =>
      participant.userId?.includes(PARTICIPANT_USER_TYPES.HOST) &&
      participant.state === STAGE_CONNECTION_STATES.CONNECTED
  );

  if (connectedHost) {
    hostData.status = STAGE_CONNECTION_STATES.CONNECTED;
    const hostChannelId = extractChannelIdFromUserId(connectedHost.userId);

    if (hostChannelId) {
      const hostChannelArn = buildChannelArn(hostChannelId);

      const { Items = [] } = await getUserByChannelArn(hostChannelArn);

      if (Items.length) {
        const { username } = unmarshall(Items[0]);
        hostData.username = username;
      }
    }
  }

  return { hostData, size: getNumberOfParticipantsInStage(participants) };
};

/**
 * Participants are allowed to join a stage when the host is connected in the stage session.
 * In the case the host is disconnected,
 * make sure there is at least 1 spot, out of 12, for the host to rejoin
 */
export const shouldAllowParticipantToJoin = async ({
  hostStatus,
  numberOfParticipantInStage
}: {
  hostStatus: STAGE_CONNECTION_STATES;
  numberOfParticipantInStage: number;
}) => {
  const isHostInStage = hostStatus === STAGE_CONNECTION_STATES.CONNECTED;

  return isHostInStage || numberOfParticipantInStage < 11;
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
