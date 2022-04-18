import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Form from '../../../../components/Form';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';

const ResetPasswordRequestForm = ({ onSuccess }) => (
  <Form
    inputsData={{ email: {} }}
    onSuccess={onSuccess}
    submitHandler={userManagement.sendResetPasswordRequest}
    submitText={$content.continue}
    title={$content.reset_password_page.title}
    footer={
      <Link to="/login">{$content.reset_password_page.return_to_login}</Link>
    }
  />
);

ResetPasswordRequestForm.propTypes = {
  onSuccess: PropTypes.func.isRequired
};

export default ResetPasswordRequestForm;
