import { useEffect, useState } from 'react';

import { dashboard as $content } from '../../../../content';
import { useNotif } from '../../../../contexts/Notification';
import { userManagement } from '../../../../api';
import { useUser } from '../../../../contexts/User';
import Button from '../../../../components/Button';
import Input from '../../../../components/Input';
import './Settings.css';

const Settings = () => {
  const [username, setUsername] = useState('');
  const [{ currentPassword, newPassword, confirmPassword }, setPassword] =
    useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  const { userData, fetchUserData, clearUserData } = useUser();
  const { notifySuccess, notifyError } = useNotif();

  useEffect(() => {
    if (userData?.username) {
      setUsername(userData.username);
    }
  }, [userData?.username]);

  const onUsernameChange = ({ target: { value } }) => {
    setUsername(value);
  };

  const onPasswordChange = ({ target: { name, value } }) => {
    setPassword((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetStreamKey = async () => {
    const { result, error } = await userManagement.resetStreamKey();

    if (result) {
      notifySuccess($content.notification.success.stream_key_reset);
      await fetchUserData();
    }

    if (error) notifyError($content.notification.error.reset_stream_key_failed);
  };

  const handleDeleteAccount = async () => {
    const { result, error } = await userManagement.deleteAccount();

    if (result) {
      userManagement.signOut();
      clearUserData();
    }
    if (error) notifyError($content.notification.error.account_deletion_failed);
  };

  const handleSavePassword = async () => {
    const { result, error } = await userManagement.changePassword(
      currentPassword,
      newPassword
    );

    if (result) notifySuccess($content.notification.success.password_saved);
    if (error) notifyError($content.notification.error.password_save_failed);
  };

  const handleSaveUsername = async () => {};

  const copyStreamKey = async () => {
    await navigator.clipboard.writeText(userData.streamKeyValue);
    notifySuccess($content.notification.success.stream_key_copied);
  };

  const copyIngestEndpoint = async () => {
    await navigator.clipboard.writeText(userData.ingestEndpoint);
    notifySuccess($content.notification.success.ingest_endpoint_copied);
  };

  return (
    userData && (
      <article className="settings-container">
        <h2>{$content.settings_page.title}</h2>
        <section>
          <h3>{$content.settings_page.stream_settings}</h3>
          <span className="input-btn-group">
            <Input
              label={$content.settings_page.stream_key}
              name="streamKeyValue"
              placeholder={$content.settings_page.stream_key}
              readOnly
              type="password"
              value={userData.streamKeyValue}
              variant="horizontal"
            />
            <Button onClick={handleResetStreamKey} variant="destructive">
              {$content.settings_page.reset}
            </Button>
            <Button onClick={copyStreamKey} variant="tertiary">
              {$content.settings_page.copy}
            </Button>
          </span>
          <span className="input-btn-group">
            <Input
              label={$content.settings_page.ingest_server_url}
              name="ingestEndpoint"
              placeholder={$content.settings_page.ingest_server_url}
              readOnly
              value={userData.ingestEndpoint}
              variant="horizontal"
            />
            <Button onClick={copyIngestEndpoint} variant="tertiary">
              {$content.settings_page.copy}
            </Button>
          </span>
        </section>
        <section>
          <h3>{$content.settings_page.account_settings}</h3>
          <span className="input-btn-group">
            <Input
              label={$content.settings_page.username}
              name="username"
              value={username}
              variant="horizontal"
              onChange={onUsernameChange}
              placeholder={$content.settings_page.enter_your_username}
            />
            <Button
              onClick={handleSaveUsername}
              isDisabled={!username || username === userData.username}
              variant="tertiary"
            >
              {$content.settings_page.save}
            </Button>
          </span>
          <Input
            className="standalone-input"
            label={$content.settings_page.current_password}
            name="currentPassword"
            onChange={onPasswordChange}
            placeholder={$content.settings_page.enter_your_current_password}
            type="password"
            value={currentPassword}
            variant="horizontal"
          />
          <Input
            className="standalone-input"
            label={$content.settings_page.new_password}
            name="newPassword"
            onChange={onPasswordChange}
            placeholder={$content.settings_page.enter_your_new_password}
            type="password"
            value={newPassword}
            variant="horizontal"
          />
          <span className="input-btn-group">
            <Input
              label={$content.settings_page.confirm_password}
              name="confirmPassword"
              onChange={onPasswordChange}
              placeholder={$content.settings_page.confirm_your_password}
              type="password"
              value={confirmPassword}
              variant="horizontal"
            />
            <Button
              onClick={handleSavePassword}
              isDisabled={!currentPassword || !newPassword || !confirmPassword}
              variant="tertiary"
            >
              {$content.settings_page.save}
            </Button>
          </span>
        </section>
        <section>
          <Input
            btnVariant="destructive"
            className="delete-button"
            label={$content.settings_page.account_deletion}
            name="deleteAccount"
            type="button"
            value={$content.settings_page.delete_my_account}
            variant="horizontal"
            onClick={handleDeleteAccount}
          />
        </section>
      </article>
    )
  );
};

export default Settings;
