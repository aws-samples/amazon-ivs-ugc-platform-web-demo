import { v4 as uuidv4 } from 'uuid';
import {
  IVSRealTimeClient,
  CreateStageCommand,
  CreateStageCommandInput,
  CreateParticipantTokenCommand,
  CreateParticipantTokenCommandInput
} from '@aws-sdk/client-ivs-realtime';
import { ChannelAssets, getChannelAssetUrls } from '../shared/helpers';
import {
  ALLOWED_CHANNEL_ASSET_TYPES,
  CUSTOM_AVATAR_NAME,
  STAGE_TOKEN_DURATION
} from '../shared/constants';
import { getUser } from '../channel/helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { ParticipantTokenCapability } from '@aws-sdk/client-ivs-realtime';

export const USER_STAGE_ID_SEPARATOR = ':stage/';
const CHANNEL_ASSET_AVATAR_DELIMITER = 'https://';

const client = new IVSRealTimeClient({});

const extractStageIdfromStageArn = (userStageArn: string | undefined) => {
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

export const handleCreateParticipantToken = async (
  input: CreateParticipantTokenCommandInput
) => {
  const command = new CreateParticipantTokenCommand(input);
  const { participantToken } = await client.send(command);

  return participantToken?.token;
};

export const buildStageArn = (stageId: string) =>
  `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}${USER_STAGE_ID_SEPARATOR}${stageId}`;

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

export const handleCreateStageParams = async (userSub: string) => {
  const { Item: UserItem = {} } = await getUser(userSub);
  const {
    avatar,
    color: profileColor,
    channelAssets,
    username
  } = unmarshall(UserItem);
  const channelAssetsAvatarUrlPath = getChannelAssetAvatarURL(
    channelAssets,
    avatar
  );

  return {
    username,
    profileColor,
    avatar,
    channelAssetsAvatarUrlPath,
    duration: STAGE_TOKEN_DURATION,
    userId: uuidv4(),
    capabilities: [
      ParticipantTokenCapability.PUBLISH,
      ParticipantTokenCapability.SUBSCRIBE
    ]
  };
};
