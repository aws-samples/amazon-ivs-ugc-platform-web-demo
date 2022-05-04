import { Link } from 'react-router-dom';

import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useState } from 'react';
import { useUser } from '../../../../contexts/User';
import Form from '../../../../components/Form';
import RegisterUserRequestConfirmation from './RegisterUserRequestConfirmation';

const RegisterUser = () => {
  const [isRequestSent, setRequestSent] = useState(false);
  const [username, setUsername] = useState('');

  const { initUserResources, checkSessionStatus } = useUser();

  const onRequestSuccess = async (result, formValues) => {
    if (result.userConfirmed) {
      const { result: signInResult } = await userManagement.signIn(formValues);

      if (signInResult) {
        await initUserResources();
        checkSessionStatus();
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
