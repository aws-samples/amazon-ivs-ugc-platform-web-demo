import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';
import { userManagement as $content } from '../../../content';

const RegisterUser = () => (
  <Form
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

export default RegisterUser;
