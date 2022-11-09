import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AcmeLrg } from '../../../assets/icons';
import { useNotif } from '../../../contexts/Notification';
import { channelAPI } from '../../../api';
import { userManagement as $content } from '../../../content';
import { useUser } from '../../../contexts/User';
import Form from '../../../components/Form';

const SigninUser = () => {
  const { checkSessionStatus, initUserResources, logOutAction } = useUser();
  const { notifySuccess, notifyError } = useNotif();
  const [searchParams] = useSearchParams();
  const { verificationCode, username } = useMemo(
    () => ({
      verificationCode: searchParams.get('code'),
      username: searchParams.get('username')
    }),
    [searchParams]
  );

  useEffect(() => {
    const confirmUser = async () => {
      const { result, error } = await channelAPI.verifyUserEmail(
        username,
        verificationCode
      );

      if (result)
        notifySuccess($content.notification.success.registration_confirmed);

      if (error)
        notifyError($content.notification.error.registration_not_confirmed);
    };

    if (verificationCode && username) {
      confirmUser();
    }
  }, [notifyError, notifySuccess, username, verificationCode]);

  useEffect(() => {
    if (logOutAction === 'accountDeletion') {
      notifySuccess($content.notification.success.account_deleted);
    }
  }, [logOutAction, notifySuccess]);

  const onSuccess = async () => {
    /**
     * If sign-in is successful, then we attempt to get this user's data and save it
     * in the context.
     *
     * If this is the first time this user has signed in, then no such data will exist.
     * In this case, we will need to create resources for this user once we hit the
     * Dashboard page and then try again to get this user's data.
     *
     * If this is not the first time this user has signed it, then we will have already
     * created resources for this user previously. Therefore, this call will retrieve
     * that information and save it in the context.
     */
    await initUserResources();
    checkSessionStatus();
  };

  return (
    <>
      <AcmeLrg className="fill-lightMode-gray-dark dark:fill-darkMode-gray" />
      <Form
        disableValidation
        submitHandler={channelAPI.signIn}
        submitText={$content.sign_in}
        title={$content.login_page.title}
        onSuccess={onSuccess}
        footer={
          <span>
            <b>{$content.login_page.new_user}</b>&nbsp;
            <Link to="/register">{$content.login_page.create_an_account}</Link>
          </span>
        }
        inputsData={{
          username: {},
          password: {
            type: 'password',
            footer: (
              <Link to="/reset">{$content.login_page.forgot_password}</Link>
            )
          }
        }}
      />
    </>
  );
};

export default SigninUser;
