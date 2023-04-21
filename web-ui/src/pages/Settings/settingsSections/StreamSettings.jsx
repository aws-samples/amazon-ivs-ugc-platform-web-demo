import { useRef, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';

import { channelAPI } from '../../../api';
import { clsm } from '../../../utils';
import { CreateVideo } from '../../../assets/icons';
import { dashboard as $content } from '../../../content';
import {
  INPUT_BUTTON_GROUP_CLASSES,
  SETTINGS_SECTION_CLASSES
} from '../SettingsTheme';
import { useModal } from '../../../contexts/Modal';
import { useNotif } from '../../../contexts/Notification';
import { useSettingsOrientation } from '../Settings';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import CopyTextInput from '../CopyTextInput';
import Input from '../../../components/Input';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';

const StreamSettings = () => {
  const { isDesktopView } = useResponsiveDevice();

  const resetStreamKeyButtonRef = useRef();
  const [isResetStreamKeyLoading, setIsResetStreamKeyLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData } = useUser();
  const settingsFormOrientation = useSettingsOrientation();

  const copyStreamKey = () => {
    copyToClipboard(userData.streamKeyValue);
    notifySuccess($content.notification.success.stream_key_copied);
  };

  const handleResetStreamKey = () => {
    if (isResetStreamKeyLoading) return;

    const resetStreamKey = async () => {
      setIsResetStreamKeyLoading(true);
      const { result, error } = await channelAPI.resetStreamKey();

      if (result) {
        await fetchUserData();
        notifySuccess($content.notification.success.stream_key_reset);
      }
      if (error)
        notifyError($content.notification.error.reset_stream_key_failed);

      setIsResetStreamKeyLoading(false);
    };

    openModal({
      content: {
        confirmText: $content.modal.reset_stream_key_modal.reset_stream_key,
        isDestructive: true,
        message: $content.modal.reset_stream_key_modal.confirm_intent_message,
        subMessage: $content.modal.reset_stream_key_modal.stream_will_terminate
      },
      lastFocusedElement: resetStreamKeyButtonRef,
      onConfirm: resetStreamKey
    });
  };

  return (
    <section className={clsm(SETTINGS_SECTION_CLASSES)}>
      <h3>{$content.settings_page.stream_settings}</h3>
      <span
        className={clsm(
          INPUT_BUTTON_GROUP_CLASSES,
          'xs:flex-wrap',
          'xs:mb-[10px]',
          'xs:space-y-2.5'
        )}
      >
        <Input
          label={$content.settings_page.stream_key}
          name="streamKeyValue"
          placeholder={$content.settings_page.stream_key}
          readOnly
          type="password"
          value={userData.streamKeyValue}
          variant={settingsFormOrientation}
        />
        <Button
          ariaLabel={`Reset ${$content.settings_page.stream_key} value`}
          className="xs:order-1"
          isLoading={isResetStreamKeyLoading}
          onClick={handleResetStreamKey}
          ref={resetStreamKeyButtonRef}
          variant="destructive"
        >
          {$content.settings_page.reset}
        </Button>
        <Button
          ariaLabel={`Copy ${$content.settings_page.stream_key} value`}
          onClick={copyStreamKey}
          variant="tertiary"
        >
          {$content.settings_page.copy}
        </Button>
      </span>
      <CopyTextInput
        label={$content.settings_page.ingest_server_url}
        name="ingestServerUrl"
        value={userData.ingestServerUrl}
        successMessage={$content.notification.success.ingest_server_url_copied}
      />
      <CopyTextInput
        label={$content.settings_page.ingest_endpoint}
        name="ingestEndpoint"
        value={userData.ingestEndpoint}
        successMessage={$content.notification.success.ingest_endpoint_copied}
      />
      <CopyTextInput
        label={$content.settings_page.playback_url}
        name="playbackUrl"
        value={userData.playbackUrl}
        successMessage={$content.notification.success.playback_url_copied}
      />
      <Button
        type="nav"
        to="/manager"
        state={{
          isWebBroadcastContainerOpen: true,
          streamManagerSelectedTab: isDesktopView ? 0 : 1
        }}
        className={clsm([
          'bg-lightMode-gray',
          'dark:[&>svg]:fill-white',
          'focus:bg-lightMode-gray',
          'hover:bg-lightMode-gray-hover',
          'md:ml-0',
          'md:w-full',
          'ml-[280px]',
          'w-56'
        ])}
        variant="secondary"
      >
        <CreateVideo className={clsm(['mr-2', 'w-6', 'h-6'])} />
        {$content.settings_page.go_live_from_web}
      </Button>
    </section>
  );
};

export default StreamSettings;
