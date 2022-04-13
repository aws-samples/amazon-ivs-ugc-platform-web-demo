import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';
import { userManagement as $content } from '../../../content';

const RegisterUser = () => (
  <Form
    submitHandler={userManagement.register}
    submitText={$content.register.create_account}
    title={$content.register.title}
    footer={
      <span>
        <b>{$content.register.have_an_account}</b>&nbsp;
        <Link to="/login">{$content.sign_in}</Link>
      </span>
    }
    inputsData={{
      username: {},
      email: {},
      password: {
        type: 'password',
        confirm: true,
        description: $content.register.password_description
      }
    }}
  />
);

export default RegisterUser;
