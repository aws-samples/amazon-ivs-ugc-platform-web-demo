import { Link, useNavigate } from 'react-router-dom';

import Form from '../../../../components/Form';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useState } from 'react';

import RegisterUserRequestConfirmation from './RegisterUserRequestConfirmation';
import { useUser } from '../../../../contexts/User';

const RegisterUser = () => {
  const [isRequestSent, setRequestSent] = useState(false);
  const [username, setUsername] = useState('');

  const navigate = useNavigate();
  const { updateUserData } = useUser();

  const onRequestSuccess = async (result, formValues) => {
    if (result.userConfirmed) {
      const { result: signInResult } = await userManagement.signIn(formValues);

      if (signInResult) {
        await updateUserData();
        navigate('/');
      }
    } else {
      setUsername(formValues.username);
      setRequestSent(true);
    }
  };

  return isRequestSent ? (
    <RegisterUserRequestConfirmation username={username} />
  ) : (
    <Form
      onSuccess={onRequestSuccess}
      submitHandler={userManagement.register}
      submitText={$content.register_page.create_account}
      title={$content.register_page.title}
      footer={
        <span>
          <b>{$content.register_page.have_an_account}</b>&nbsp;
          <Link to="/login">{$content.sign_in}</Link>
        </span>
      }
      inputsData={{
        username: {},
        email: {},
        password: {
          type: 'password',
          confirm: true,
          description: $content.register_page.password_description
        }
      }}
    />
  );
};

export default RegisterUser;
