import * as avatars from '../assets/avatars';

export const CUSTOM_AVATAR_NAME = 'custom';
export const getAvatarSrc = (data) => {
  if (!data) return '';

  const {
    avatar: avatarName,
    channelAssetUrls: { avatar: avatarUrl = '' } = { avatar: '' }
  } = data;

  return avatarName === CUSTOM_AVATAR_NAME ? avatarUrl : avatars[avatarName];
};
