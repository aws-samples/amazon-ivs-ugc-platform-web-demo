import { useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';

import { dashboard as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { userManagementAPI } from '../../api';
import { useUser } from '../../contexts/User';
import Button from '../../components/Button';
import Input from '../../components/Input';
import './Settings.css';

const StreamSettings = () => {
  const [isResetStreamKeyLoading, setIsResetStreamKeyLoading] = useState(false);
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData } = useUser();
  const inputVariant = isDefaultResponsiveView ? 'vertical' : 'horizontal';

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
      const { result, error } = await userManagementAPI.resetStreamKey();

      if (result) {
        await fetchUserData();
        notifySuccess($content.notification.success.stream_key_reset);
      }
      if (error)
        notifyError($content.notification.error.reset_stream_key_failed);

      setIsResetStreamKeyLoading(false);
    };

    openModal({
      isDestructive: true,
      message: $content.modal.reset_stream_key_modal.confirm_intent_message,
      subMessage: $content.modal.reset_stream_key_modal.stream_will_terminate,
      confirmText: $content.modal.reset_stream_key_modal.reset_stream_key,
      onConfirm: resetStreamKey
    });
  };

  return (
    <section>
      <h3>{$content.settings_page.stream_settings}</h3>
      <span data-test-id="stream-key-settings" className="input-btn-group">
        <Input
          label={$content.settings_page.stream_key}
          name="streamKeyValue"
          placeholder={$content.settings_page.stream_key}
          readOnly
          type="password"
          value={userData.streamKeyValue}
          variant={inputVariant}
        />
        <Button
          className="input-button"
          isLoading={isResetStreamKeyLoading}
          onClick={handleResetStreamKey}
          variant="destructive"
        >
          {$content.settings_page.reset}
        </Button>
        <Button
          className="input-button"
          onClick={copyStreamKey}
          variant="tertiary"
        >
          {$content.settings_page.copy}
        </Button>
      </span>
      <span data-test-id="ingest-endpoint-settings" className="input-btn-group">
        <Input
          label={$content.settings_page.ingest_server_url}
          name="ingestEndpoint"
          placeholder={$content.settings_page.ingest_server_url}
          readOnly
          value={userData.ingestEndpoint}
          variant={inputVariant}
        />
        <Button
          className="input-button"
          onClick={copyIngestEndpoint}
          variant="tertiary"
        >
          {$content.settings_page.copy}
        </Button>
      </span>
    </section>
  );
};

export default StreamSettings;
