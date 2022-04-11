import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';

const RegisterUser = () => (
  <Form
    submitHandler={userManagement.register}
    submitText="Create account"
    title="Create a new account"
    footer={
      <span>
        <b>Have an account?</b>&nbsp;
        <Link to="/login">Sign in</Link>
      </span>
    }
    inputsData={{
      username: {},
      email: {},
      password: {
        type: 'password',
        confirm: true
        // footer: '8 or more characters with a mix of uppercase & lowercase letters, numbers & symbols'
      }
    }}
  />
);

export default RegisterUser;
