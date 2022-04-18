import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';
import { userManagement as $content } from '../../../content';

const SigninUser = () => (
  <Form
    submitHandler={userManagement.signIn}
    submitText={$content.sign_in}
    title={$content.login_page.title}
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

export default SigninUser;
