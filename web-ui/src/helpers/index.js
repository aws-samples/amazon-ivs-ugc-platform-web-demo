import * as avatars from '../assets/avatars';

export const getAvatarSrc = (data) => {
  if (!data) return '';

  const {
    avatar: avatarName,
    channelAssetUrls: { avatar: avatarUrl = '' } = { avatar: '' }
  } = data;

  return avatarName === 'custom' ? avatarUrl : avatars[avatarName];
};
