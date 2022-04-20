import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { userManagement } from '../../../api';
import { userManagement as $content } from '../../../content';
import { useUser } from '../../../contexts/User';
import Form from '../../../components/Form';
import { useNotif } from '../../../contexts/Notification';

const SigninUser = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { updateUserData } = useUser();
  const { notifySuccess, notifyError } = useNotif();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const { verificationCode, username } = useMemo(() => {
    const verificationCode = query.get('code');
    const username = query.get('username');

    return { verificationCode, username };
  }, [query]);

  useEffect(() => {
    const confirmUser = async () => {
      const { result, error } = await userManagement.verifyUserEmail();

      if (result)
        notifySuccess($content.notification.success.registration_confirmed);

      if (error)
        notifyError($content.notification.error.registration_not_confirmed);
    };

    if (verificationCode && username) {
      confirmUser();
    }
  }, [notifyError, notifySuccess, username, verificationCode]);

  const submitHandler = async (formValues) => {
    const { result, error } = await userManagement.signIn(formValues);

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
    if (result) await updateUserData();

    return { result, error };
  };

  return (
    <Form
      submitHandler={submitHandler}
      submitText={$content.sign_in}
      title={$content.login_page.title}
      onSuccess={() => navigate('/')}
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
          footer: <Link to="/reset">{$content.login_page.forgot_password}</Link>
        }
      }}
    />
  );
};

export default SigninUser;
