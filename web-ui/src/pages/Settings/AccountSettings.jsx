import { useCallback, useState } from 'react';

import { dashboard as $content } from '../../content';
import { getInputErrorData } from './utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { userManagement } from '../../api';
import { useUser } from '../../contexts/User';
import useThrottledCallback from '../../hooks/useThrottledCallback';
import * as userAvatars from '../../assets/avatars';
import { PROFILE_COLORS } from '../../constants'
import Form from '../../components/Form';
import Input from '../../components/Input';
import IconSelect from '../../components/IconSelect';
import './Settings.css';

const defaultFormProps = (inputVariant) => ({
  formVariant: 'horizontal',
  inputVariant,
  submitBtnVariant: 'tertiary',
  submitText: $content.settings_page.save
});

const AccountSettings = () => {
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData, logOut } = useUser();
  const inputVariant = isDefaultResponsiveView ? 'vertical' : 'horizontal';
  const profileColors = PROFILE_COLORS.reduce((a, v) => ({ ...a, [v]: v}), {}) 

  const handleDeleteAccount = () => {
    if (isDeleteAccountLoading) return;

    const deleteAccount = async () => {
      setIsDeleteAccountLoading(true);
      const { result, error } = await userManagement.deleteAccount();

      if (result) {
        logOut('accountDeletion');
      }
      if (error)
        notifyError($content.notification.error.account_deletion_failed);

      setIsDeleteAccountLoading(false);
    };

    openModal({
      isDestructive: true,
      message: $content.modal.account_deletion_modal.confirm_intent_message,
      confirmText: $content.modal.account_deletion_modal.delete_account,
      onConfirm: deleteAccount
    });
  };

  const handleSavePasswordError = useCallback(
    (error) => {
      notifyError($content.notification.error.password_save_failed);
      const { contentKey, message } = getInputErrorData(error);
      const errorType = 'input_error';
      const errors = [];
      if (contentKey === 'incorrect_password') {
        errors.push({ errorType, inputName: 'currentPassword', message });
      } else {
        errors.push(
          { errorType, inputName: 'currentPassword', message: '' },
          { errorType, inputName: 'newPassword', message: '' },
          { errorType, inputName: 'confirmNewPassword', message }
        );
      }

      return errors;
    },
    [notifyError]
  );

  const handleSaveUsernameError = useCallback(
    (error) => {
      notifyError($content.notification.error.username_save_failed);
      const { message } = getInputErrorData(error);
      return [{ errorType: 'input_error', inputName: 'username', message }];
    },
    [notifyError]
  );

  const handleChangeAvatar = useThrottledCallback(async (newAvatar, callback) => {
      if (newAvatar === userData.avatar) return;

      const userPreferences = {
        avatar: newAvatar,
        color: userData.color
      };
      const { result, error } = await userManagement.changeUserPreferences(userPreferences);
      if (!error) {
        notifyError($content.notification.error.avatar_failed_to_save);
      }
      if (result) {
        notifySuccess($content.notification.success.avatar_saved);
        callback(result.avatar);
        await fetchUserData();
      }
    },
    500,
    [userData.color, userData.avatar, fetchUserData]
  );

  const handleChangeColor = useThrottledCallback(async (newColor, callback) => {  
      if (newColor === userData.color) return;

      const userPreferences = {
        avatar: userData.avatar,
        color: newColor
      };
      const { result, error } = await userManagement.changeUserPreferences(userPreferences);
      if (error) {
        notifyError($content.notification.error.color_failed_to_save);
      }
      if (result) {
        notifySuccess($content.notification.success.color_saved);
        callback(result.color);
        await fetchUserData();
      }
    },
    500,
    [userData.avatar, userData.color, fetchUserData]
  );

  return (
    <>
      <section>
        <h3>{$content.settings_page.account_settings}</h3>
        <Form
          {...defaultFormProps(inputVariant)}
          data-test-id="change-username-form"
          clearFormOnSuccess={false}
          disableSubmit={({ username }) => username.value === userData.username}
          errorHandler={handleSaveUsernameError}
          inputsData={{ username: { value: userData?.username || '' } }}
          onSuccess={async () => {
            await fetchUserData();
            notifySuccess($content.notification.success.username_saved);
          }}
          submitHandler={userManagement.changeUsername}
        />
        <Form
          {...defaultFormProps(inputVariant)}
          data-test-id="change-password-form"
          errorHandler={handleSavePasswordError}
          inputsData={{
            'current password': { type: 'password', skipValidation: true },
            'new password': {
              type: 'password',
              confirmedBy: 'confirmNewPassword',
              placeholder: $content.settings_page.create_your_new_password
            }
          }}
          onSuccess={() => {
            notifySuccess($content.notification.success.password_saved);
            openModal({
              cancellable: false,
              confirmText: $content.modal.password_updated_modal.okay,
              message: $content.modal.password_updated_modal.password_updated,
              subMessage:
                $content.modal.password_updated_modal.confirmation_message
            });
          }}
          submitHandler={userManagement.changePassword}
          validationCheck={({ currentPassword, newPassword }) => {
            if (currentPassword.value === newPassword.value) {
              return {
                newPassword:
                  $content.settings_page.input_error.same_as_old_password
              };
            }
          }}
        />
        <IconSelect
          name="avatar"
          label="Avatar"
          type="image"
          items={userAvatars}
          selected={userData.avatar}
          onClick={handleChangeAvatar}
          variant={inputVariant}
        />
        <IconSelect
          name="color"
          label="Color"
          type="color"
          items={profileColors}
          selected={userData.color}
          onClick={handleChangeColor}
          variant={inputVariant}
        />
      </section>
      <section>
        <span className="input-container">
          <Input
            btnVariant="destructive"
            isLoading={isDeleteAccountLoading}
            label={$content.settings_page.account_deletion}
            name="deleteAccount"
            onClick={handleDeleteAccount}
            type="button"
            value={$content.settings_page.delete_my_account}
            variant={inputVariant}
            customStyles={{ width: '190px' }}
          />
        </span>
      </section>
    </>
  );
};

export default AccountSettings;
