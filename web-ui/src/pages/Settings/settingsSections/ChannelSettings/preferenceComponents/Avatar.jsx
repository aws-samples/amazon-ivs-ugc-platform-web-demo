import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

import { channelAPI } from '../../../../../api';
import { dashboard as $content } from '../../../../../content';
import {
  MaximumSizeExceededError,
  UnsupportedFileFormatError
} from '../../../../../hooks/useImageUpload';
import { useNotif } from '../../../../../contexts/Notification';
import { useUser } from '../../../../../contexts/User';
import * as userAvatars from '../../../../../assets/avatars';
import IconSelect from '../../../../../components/IconSelect';
import ImageUploader from '../ImageUploader';
import SettingContainer from '../../SettingContainer';
import UploadAvatarMarker from './UploadAvatarMarker';
import useStateWithCallback from '../../../../../hooks/useStateWithCallback';

const CUSTOM_AVATAR_NAME = 'custom';

const Avatar = () => {
  const { userData, fetchUserData } = useUser();
  const { avatar, channelAssetUrls } = userData || {};
  const { notifySuccess, notifyError } = useNotif();
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatar);
  const [avatarUrl, setAvatarUrl] = useStateWithCallback(
    channelAssetUrls?.avatar || ''
  );
  const [isAvatarUploaderOpen, setIsAvatarUploaderOpen] = useState(
    avatar === CUSTOM_AVATAR_NAME
  );
  const isAvatarUploaded = useRef(!!avatarUrl);
  const userAvatarItems = useMemo(
    () => [
      [
        CUSTOM_AVATAR_NAME,
        avatarUrl,
        {
          CustomMarker: (
            <UploadAvatarMarker
              isOpen={isAvatarUploaderOpen}
              isUploaded={isAvatarUploaded.current}
            />
          )
        }
      ],
      ...Object.entries(userAvatars)
    ],
    [avatarUrl, isAvatarUploaded, isAvatarUploaderOpen]
  );

  const handleChangeAvatar = useCallback(
    async (newAvatar, action = 'selection') => {
      const isCustomAvatar = newAvatar === CUSTOM_AVATAR_NAME;
      const isSameAvatarSelected = avatar === newAvatar;

      if (isAvatarLoading) return;

      setIsAvatarUploaderOpen((prev) => {
        if (isCustomAvatar) return isAvatarUploaded.current || !prev;

        return false;
      });

      if (isSameAvatarSelected || (isCustomAvatar && !isAvatarUploaded.current))
        return;

      setSelectedAvatar(newAvatar); // eagerly set the selected avatar
      setIsAvatarLoading(true);
      const { result, error } = await channelAPI.changeUserPreferences({
        avatar: newAvatar
      });

      if (result) {
        await fetchUserData();
        setSelectedAvatar(result.avatar);
        if (action === 'selection')
          notifySuccess($content.notification.success.avatar_saved);
      }

      if (error) {
        setSelectedAvatar(avatar);
        notifyError($content.notification.error.avatar_failed_to_save);
      }

      setIsAvatarLoading(false);
    },
    [avatar, fetchUserData, isAvatarLoading, notifyError, notifySuccess]
  );

  const onUpload = useCallback(
    ({ result: previewUrl, error }) => {
      if (error) {
        switch (true) {
          case error instanceof UnsupportedFileFormatError:
            return notifyError($content.notification.error.cant_select_file);
          case error instanceof MaximumSizeExceededError:
            return notifyError(
              $content.notification.error.image_exceeded_max_size
            );
          default:
            return notifyError(
              $content.notification.error.avatar_failed_to_upload
            );
        }
      }

      setAvatarUrl(previewUrl, () => {
        isAvatarUploaded.current = true;
        handleChangeAvatar('custom', 'upload');
        notifySuccess($content.notification.success.avatar_uploaded);
      });
    },
    [handleChangeAvatar, notifyError, notifySuccess, setAvatarUrl]
  );

  const onDelete = useCallback(
    ({ error }) => {
      if (error)
        return notifyError($content.notification.error.avatar_failed_to_delete);

      setAvatarUrl('', () => {
        isAvatarUploaded.current = false;
        const avatarNames = Object.keys(userAvatars);
        const randomAvatar =
          avatarNames[Math.floor(Math.random() * avatarNames.length)];

        handleChangeAvatar(randomAvatar, 'deletion');
        notifySuccess($content.notification.success.avatar_deleted);
      });
    },
    [handleChangeAvatar, notifyError, notifySuccess, setAvatarUrl]
  );

  return (
    <SettingContainer label={$content.settings_page.avatar}>
      <IconSelect
        isLoading={isAvatarLoading}
        items={userAvatarItems}
        onSelect={handleChangeAvatar}
        selected={selectedAvatar}
        type="image"
      />
      <AnimatePresence initial={false}>
        {isAvatarUploaderOpen && (
          <ImageUploader
            assetType="avatar"
            className="mt-8"
            onDelete={onDelete}
            onUpload={onUpload}
            uploadUrl={avatarUrl}
          />
        )}
      </AnimatePresence>
    </SettingContainer>
  );
};

export default Avatar;
