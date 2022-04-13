import { Link } from 'react-router-dom';

import Form from '../../../components/Form';
import { userManagement } from '../../../api';
import { userManagement as $content } from '../../../content';

const RecoverPassword = () => (
  <Form
    submitHandler={userManagement.recoverPassword}
    submitText={$content.continue}
    title={$content.reset_password.title}
    footer={<Link to="/login">{$content.reset_password.return_to_login}</Link>}
    inputsData={{ email: {} }}
  />
);

export default RecoverPassword;
