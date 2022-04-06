import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { signIn } from '../../../api';

const SigninUser = () => (
  <Form
    submitHandler={signIn}
    submitText="Sign in"
    title="Sign in to your account"
    footer={
      <span>
        <b>New user?</b>&nbsp;
        <Link to="/register">Create an account</Link>
      </span>
    }
    inputsData={{
      username: {},
      password: {
        type: 'password',
        footer: <Link to="/recover">Forgot password?</Link>
      }
    }}
  />
);

export default SigninUser;
