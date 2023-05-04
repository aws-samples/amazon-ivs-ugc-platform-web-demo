import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import Form from '../../../../components/Form';
import { channelAPI } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useNotif } from '../../../../contexts/Notification';

const ResetPasswordConfirmation = ({ username, verificationCode }) => {
  const navigate = useNavigate();
  const { notifySuccess } = useNotif();

  const submitHandler = ({ newPassword }) => {
    return channelAPI.resetPassword(username, verificationCode, newPassword);
  };

  const onSuccess = () => {
    notifySuccess($content.reset_password_page.reset_password_success);
    navigate('/login');
  };

  return (
    <Form
      inputsData={{
        'new password': { type: 'password', confirmedBy: 'confirmNewPassword' }
      }}
      onSuccess={onSuccess}
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
