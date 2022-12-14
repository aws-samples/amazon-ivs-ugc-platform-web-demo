import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';

import { channelAPI } from '../../../../../api';
import { CUSTOM_AVATAR_NAME } from '../../../../../helpers';
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
  const imageUploaderRef = useRef();

  const handleChangeAvatar = useCallback(
    async ({
      newSelection,
      previewUrl,
      uploadDateTime,
      action = 'selection'
    }) => {
      const isCustomAvatar = newSelection === CUSTOM_AVATAR_NAME;
      const isSameAvatarSelected = avatar === newSelection;

      if (isAvatarLoading) return;

      setIsAvatarUploaderOpen((prev) => {
        let shouldOpen = false;

        if (isCustomAvatar) shouldOpen = isAvatarUploaded.current || !prev;

        if (shouldOpen) {
          setTimeout(
            () =>
              imageUploaderRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              }),
            350
          );
        }

        return shouldOpen;
      });

      if (
        action !== 'upload' &&
        (isSameAvatarSelected || (isCustomAvatar && !isAvatarUploaded.current))
      )
        return;

      setSelectedAvatar(newSelection); // eagerly set the selected avatar
      setIsAvatarLoading(true);
      const { result, error } = await channelAPI.changeUserPreferences({
        avatar: { name: newSelection, previewUrl, uploadDateTime }
      });

      if (result) {
        await fetchUserData();
        setSelectedAvatar(result.avatar.name);
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
    ({ result, error }) => {
      if (result) {
        const { previewUrl, uploadDateTime } = result;

        setAvatarUrl(previewUrl, () => {
          isAvatarUploaded.current = true;
          handleChangeAvatar({
            action: 'upload',
            newSelection: CUSTOM_AVATAR_NAME,
            previewUrl,
            uploadDateTime
          });
        });
      }

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
    },
    [handleChangeAvatar, notifyError, setAvatarUrl]
  );

  const onImageDownload = useCallback(
    () => notifySuccess($content.notification.success.avatar_uploaded),
    [notifySuccess]
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

        handleChangeAvatar({ newSelection: randomAvatar, action: 'deletion' });
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
            ref={imageUploaderRef}
            assetType="avatar"
            className="mt-8"
            onDelete={onDelete}
            onImageDownload={onImageDownload}
            onUpload={onUpload}
            uploadUrl={avatarUrl}
          />
        )}
      </AnimatePresence>
    </SettingContainer>
  );
};

export default Avatar;
