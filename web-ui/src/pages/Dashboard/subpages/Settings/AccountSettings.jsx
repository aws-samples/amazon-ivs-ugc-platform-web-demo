import { useCallback, useState } from 'react';

import { dashboard as $content } from '../../../../content';
import { getInputErrorData } from './utils';
import { useMobileBreakpoint } from '../../../../contexts/MobileBreakpoint';
import { useModal } from '../../../../contexts/Modal';
import { useNotif } from '../../../../contexts/Notification';
import { userManagement } from '../../../../api';
import { useUser } from '../../../../contexts/User';
import Form from '../../../../components/Form';
import Input from '../../../../components/Input';
import './Settings.css';

const defaultFormProps = (inputVariant) => ({
  formVariant: 'horizontal',
  inputVariant,
  submitBtnVariant: 'tertiary',
  submitText: $content.settings_page.save
});

const AccountSettings = () => {
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const { isMobileView } = useMobileBreakpoint();
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { userData, fetchUserData, clearUserData } = useUser();
  const inputVariant = isMobileView ? 'vertical' : 'horizontal';

  const handleDeleteAccount = async () => {
    if (isDeleteAccountLoading) return;

    const deleteAccount = async () => {
      setIsDeleteAccountLoading(true);
      const { result, error } = await userManagement.deleteAccount();

      if (result) {
        userManagement.signOut();
        clearUserData();
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

  return (
    <>
      <section>
        <h3>{$content.settings_page.account_settings}</h3>
        <Form
          {...defaultFormProps(inputVariant)}
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
          errorHandler={handleSavePasswordError}
          inputsData={{
            'current password': { type: 'password', skipValidation: true },
            'new password': {
              type: 'password',
              confirm: true,
              placeholder: $content.settings_page.create_your_new_password
            }
          }}
          onSuccess={() =>
            notifySuccess($content.notification.success.password_saved)
          }
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
            customStyles={{ width: '185px' }}
          />
        </span>
      </section>
    </>
  );
};

export default AccountSettings;
