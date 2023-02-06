import { useCallback } from 'react';

import { channelAPI } from '../../../../../api';
import { dashboard as $content } from '../../../../../content';
import {
  MaximumSizeExceededError,
  UnsupportedFileFormatError
} from '../../../../../hooks/useImageUpload';
import { useNotif } from '../../../../../contexts/Notification';
import { useUser } from '../../../../../contexts/User';
import ImageUploader from '../ImageUploader';
import SettingContainer from '../../SettingContainer';
import useStateWithCallback from '../../../../../hooks/useStateWithCallback';

const Banner = () => {
  const { notifySuccess, notifyError } = useNotif();
  const { userData, fetchUserData } = useUser();

  const { channelAssetUrls } = userData || {};
  const [bannerUrl, setBannerUrl] = useStateWithCallback(
    channelAssetUrls?.banner || ''
  );

  const handleChangeBanner = useCallback(
    async ({ previewUrl, uploadDateTime }) => {
      const { result, error } = await channelAPI.changeUserPreferences({
        banner: { previewUrl, uploadDateTime }
      });

      if (result) {
        await fetchUserData();
      }

      if (error) {
        const { banner } = channelAssetUrls;

        setBannerUrl(banner);
        notifyError($content.notification.error.banner_failed_to_save);
      }
    },
    [channelAssetUrls, fetchUserData, notifyError, setBannerUrl]
  );

  const onUpload = useCallback(
    ({ result, error }) => {
      if (result) {
        const { previewUrl } = result;

        setBannerUrl(previewUrl, () => {
          handleChangeBanner(result);
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
              $content.notification.error.banner_failed_to_upload
            );
        }
      }
    },
    [handleChangeBanner, notifyError, setBannerUrl]
  );

  const onImageDownload = useCallback(
    () => notifySuccess($content.notification.success.banner_uploaded),
    [notifySuccess]
  );

  const onDelete = useCallback(
    ({ error }) => {
      if (error) {
        return notifyError($content.notification.error.banner_failed_to_delete);
      }

      setBannerUrl('', () => {
        fetchUserData();
        notifySuccess($content.notification.success.banner_deleted);
      });
    },
    [fetchUserData, notifyError, notifySuccess, setBannerUrl]
  );

  return (
    <SettingContainer label={$content.settings_page.banner}>
      <ImageUploader
        previewShape="16/9"
        assetType="banner"
        shouldAnimate={false}
        onDelete={onDelete}
        onImageDownload={onImageDownload}
        onUpload={onUpload}
        uploadUrl={bannerUrl}
      />
    </SettingContainer>
  );
};

export default Banner;
