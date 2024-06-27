import * as avatars from '../assets/avatars';

export const CUSTOM_AVATAR_NAME = 'custom';
export const getAvatarSrc = (data) => {
  if (!data) return '';

  let avatarUrl;
  let avatarName = data.avatar || '';

  if (data.channelAssetsAvatarUrl) {
    ({ avatar: avatarName, channelAssetsAvatarUrl: avatarUrl } = data);
  }

  if (data.channelAssetUrls) {
    ({
      avatar: avatarName,
      channelAssetUrls: { avatar: avatarUrl = '' } = { avatar: '' }
    } = data);
  }

  return avatarName === CUSTOM_AVATAR_NAME ? avatarUrl : avatars[avatarName];
};
