import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import Form from '../../../../components/Form';
import { userManagementAPI } from '../../../../api';
import { userManagement as $content } from '../../../../content';

const ResetPasswordConfirmation = ({ username, verificationCode }) => {
  const navigate = useNavigate();

  const submitHandler = ({ newPassword }) => {
    return userManagementAPI.resetPassword(
      username,
      verificationCode,
      newPassword
    );
  };

  return (
    <Form
      inputsData={{
        'new password': { type: 'password', confirmedBy: 'confirmNewPassword' }
      }}
      onSuccess={() => navigate('/login')}
      submitHandler={submitHandler}
      submitText={$content.reset_password_page.reset_password}
      title={$content.reset_password_page.title}
    />
  );
};

ResetPasswordConfirmation.propTypes = {
  username: PropTypes.string.isRequired,
  verificationCode: PropTypes.string.isRequired
};

export default ResetPasswordConfirmation;
