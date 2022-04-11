import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';

const RecoverPassword = () => (
  <Form
    submitHandler={userManagement.recoverPassword}
    submitText="Continue"
    title="Reset your password"
    footer={<Link to="/login">Return to login</Link>}
    inputsData={{ email: {} }}
  />
);

export default RecoverPassword;
