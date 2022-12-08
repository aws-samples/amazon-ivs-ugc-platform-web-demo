import { useRef, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';

import { channelAPI } from '../../../api';
import { clsm } from '../../../utils';
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
import Input from '../../../components/Input';

const StreamSettings = () => {
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

  const copyIngestEndpoint = () => {
    copyToClipboard(userData.ingestEndpoint);
    notifySuccess($content.notification.success.ingest_endpoint_copied);
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
        data-testid="stream-key-settings"
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
          className="xs:order-1"
          isLoading={isResetStreamKeyLoading}
          onClick={handleResetStreamKey}
          ref={resetStreamKeyButtonRef}
          variant="destructive"
        >
          {$content.settings_page.reset}
        </Button>
        <Button onClick={copyStreamKey} variant="tertiary">
          {$content.settings_page.copy}
        </Button>
      </span>
      <span
        className={clsm(INPUT_BUTTON_GROUP_CLASSES)}
        data-testid="ingest-endpoint-settings"
      >
        <Input
          label={$content.settings_page.ingest_server_url}
          name="ingestEndpoint"
          placeholder={$content.settings_page.ingest_server_url}
          readOnly
          value={userData.ingestEndpoint}
          variant={settingsFormOrientation}
        />
        <Button onClick={copyIngestEndpoint} variant="tertiary">
          {$content.settings_page.copy}
        </Button>
      </span>
    </section>
  );
};

export default StreamSettings;
