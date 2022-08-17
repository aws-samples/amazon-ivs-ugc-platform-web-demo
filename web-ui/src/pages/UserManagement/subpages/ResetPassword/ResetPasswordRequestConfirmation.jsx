import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Button from '../../../../components/Button';
import { userManagementAPI } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useNotif } from '../../../../contexts/Notification';

const ResetPasswordRequestConfirmation = ({ email }) => {
  const { notifySuccess, notifyError } = useNotif();

  const resend = async () => {
    const userData = { email };
    const { result, error } = await userManagementAPI.sendResetPasswordRequest(
      userData
    );

    if (result) {
      notifySuccess($content.notification.success.resent_confirmation);
    }

    if (error) {
      notifyError($content.notification.error.unexpected_error_occurred);
    }
  };

  return (
    <div className="sub-page-container">
      <h2>{$content.reset_password_page.title}</h2>
      <p className="p1">{$content.reset_password_page.email_link_sent}</p>
      <span className="resend-action-container">
        <b>{$content.did_not_receive_email}</b>
        <Button onClick={resend} type="button" variant="secondary">
          {$content.resend}
        </Button>
      </span>
      <Link to="/login">{$content.return_to_login}</Link>
    </div>
  );
};

ResetPasswordRequestConfirmation.propTypes = {
  email: PropTypes.string.isRequired
};

export default ResetPasswordRequestConfirmation;
