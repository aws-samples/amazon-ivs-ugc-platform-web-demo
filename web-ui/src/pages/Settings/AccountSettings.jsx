import { useCallback, useRef, useState } from 'react';

import './Settings.css';
import { clsm } from '../../utils';
import { dashboard as $content } from '../../content';
import { getInputErrorData } from './utils';
import { OUTER_INPUT_VARIANT_CLASSES as outerInputClasses } from '../../components/Input/InputTheme';
import { PROFILE_COLORS } from '../../constants';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { channelAPI } from '../../api';
import { useUser } from '../../contexts/User';
import * as userAvatars from '../../assets/avatars';
import Button from '../../components/Button';
import Form from '../../components/Form';
import IconSelect from '../../components/IconSelect';
import InputLabel from '../../components/Input/InputLabel';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const defaultFormProps = (inputVariant) => ({
  formVariant: 'horizontal',
  inputVariant,
  submitBtnVariant: 'tertiary',
  submitText: $content.settings_page.save
});

const AccountSettings = () => {
  const deleteAccountButtonRef = useRef();
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [isChangeAvatarLoading, setIsChangeAvatarLoading] = useState(false);
  const [isChangeColorLoading, setIsChangeColorLoading] = useState(false);
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData, logOut } = useUser();
  const inputVariant = isDefaultResponsiveView ? 'vertical' : 'horizontal';
  const profileColorItems = PROFILE_COLORS.reduce(
    (acc, color) => ({ ...acc, [color]: `bg-profile-${color}` }),
    {}
  );
  const inputContainerClasses = clsm(outerInputClasses[inputVariant]);

  const handleDeleteAccount = useCallback(() => {
    if (isDeleteAccountLoading) return;

    const deleteAccount = async () => {
      setIsDeleteAccountLoading(true);
      const { result, error } = await channelAPI.deleteAccount();

      if (result) {
        logOut('accountDeletion');
      }
      if (error)
        notifyError($content.notification.error.account_deletion_failed);

      setIsDeleteAccountLoading(false);
    };

    openModal({
      content: {
        confirmText: $content.modal.account_deletion_modal.delete_account,
        isDestructive: true,
        message: $content.modal.account_deletion_modal.confirm_intent_message
      },
      onConfirm: deleteAccount,
      lastFocusedElement: deleteAccountButtonRef
    });
  }, [isDeleteAccountLoading, logOut, notifyError, openModal]);

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

  const handleChangeAvatar = useThrottledCallback(
    async (newAvatar, callback) => {
      if (newAvatar === userData.avatar) return;

      setIsChangeAvatarLoading(true);

      const userPreferences = { avatar: newAvatar };
      const { result, error } = await channelAPI.changeUserPreferences(
        userPreferences
      );

      setIsChangeAvatarLoading(false);

      if (error) {
        callback(userData.avatar);
        notifyError($content.notification.error.avatar_failed_to_save);
      }
      if (result) {
        callback(result.avatar);
        notifySuccess($content.notification.success.avatar_saved);
        await fetchUserData();
      }
    },
    500,
    [fetchUserData, notifyError, notifySuccess, userData.avatar]
  );

  const handleChangeColor = useThrottledCallback(
    async (newColor, callback) => {
      if (newColor === userData.color) return;

      setIsChangeColorLoading(true);

      const userPreferences = { color: newColor };
      const { result, error } = await channelAPI.changeUserPreferences(
        userPreferences
      );

      setIsChangeColorLoading(false);

      if (error) {
        callback(userData.color);
        notifyError($content.notification.error.color_failed_to_save);
      }
      if (result) {
        callback(result.color);
        notifySuccess($content.notification.success.color_saved);
        await fetchUserData();
      }
    },
    500,
    [fetchUserData, notifyError, notifySuccess, userData.color]
  );

  return (
    <>
      <section>
        <h3>{$content.settings_page.account_settings}</h3>
        <Form
          {...defaultFormProps(inputVariant)}
          data-testid="change-username-form"
          clearFormOnSuccess={false}
          disableSubmit={({ username }) => username.value === userData.username}
          errorHandler={handleSaveUsernameError}
          inputsData={{ username: { value: userData?.username || '' } }}
          onSuccess={async () => {
            await fetchUserData();
            notifySuccess($content.notification.success.username_saved);
          }}
          submitHandler={channelAPI.changeUsername}
        />
        <Form
          {...defaultFormProps(inputVariant)}
          data-testid="change-password-form"
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
              content: {
                isInformational: true,
                confirmText: $content.modal.password_updated_modal.okay,
                message: $content.modal.password_updated_modal.password_updated,
                subMessage:
                  $content.modal.password_updated_modal.confirmation_message
              }
            });
          }}
          submitHandler={channelAPI.changePassword}
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
          isLoading={isChangeAvatarLoading}
          name="avatar"
          label="Avatar"
          type="image"
          items={userAvatars}
          selected={userData.avatar}
          onClick={handleChangeAvatar}
          variant={inputVariant}
        />
        <IconSelect
          isLoading={isChangeColorLoading}
          name="color"
          label="Color"
          type="color"
          items={profileColorItems}
          selected={userData.color}
          onClick={handleChangeColor}
          variant={inputVariant}
        />
      </section>
      <section>
        <span className={inputContainerClasses}>
          <InputLabel
            label={$content.settings_page.account_deletion}
            htmlFor="deleteAccount"
            variant={inputVariant}
          />
          <Button
            className="min-w-[190px]"
            isLoading={isDeleteAccountLoading}
            onClick={handleDeleteAccount}
            ref={deleteAccountButtonRef}
            type="button"
            variant="destructive"
          >
            {$content.settings_page.delete_my_account}
          </Button>
        </span>
      </section>
    </>
  );
};

export default AccountSettings;
