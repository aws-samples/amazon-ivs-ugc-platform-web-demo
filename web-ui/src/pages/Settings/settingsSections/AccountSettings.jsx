import { useCallback, useRef, useState } from 'react';

import { channelAPI } from '../../../api';
import { clsm } from '../../../utils';
import { dashboard as $content } from '../../../content';
import { getInputErrorData } from '../utils';
import { OUTER_INPUT_VARIANT_CLASSES as outerInputClasses } from '../../../components/Input/InputTheme';
import { SETTINGS_SECTION_CLASSES } from '../SettingsTheme';
import { useModal } from '../../../contexts/Modal';
import { useNotif } from '../../../contexts/Notification';
import { useSettingsOrientation } from '../Settings';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import Form from '../../../components/Form';
import InputLabel from '../../../components/Input/InputLabel';

const defaultFormProps = (settingsFormOrientation) => ({
  formVariant: 'horizontal',
  inputVariant: settingsFormOrientation,
  submitBtnVariant: 'tertiary',
  submitText: $content.settings_page.save
});

const AccountSettings = () => {
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData, logOut } = useUser();
  const settingsFormOrientation = useSettingsOrientation();
  const deleteAccountButtonRef = useRef();

  const handleDeleteAccount = useCallback(() => {
    if (isDeleteAccountLoading) return;

    const deleteAccount = async () => {
      setIsDeleteAccountLoading(true);
      const { result, error } = await channelAPI.deleteAccount();

      if (result) logOut('accountDeletion');
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

  return (
    <section className={clsm(SETTINGS_SECTION_CLASSES)}>
      <h3>{$content.settings_page.account_settings}</h3>
      <Form
        {...defaultFormProps(settingsFormOrientation)}
        className="space-y-8"
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
        {...defaultFormProps(settingsFormOrientation)}
        className="space-y-8"
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
      <span
        className={clsm(
          outerInputClasses[settingsFormOrientation],
          'pt-[20px]'
        )}
      >
        <InputLabel
          label={$content.settings_page.account_deletion}
          htmlFor="deleteAccount"
          variant={settingsFormOrientation}
        />
        <Button
          className="min-w-[220px]"
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
  );
};

export default AccountSettings;
