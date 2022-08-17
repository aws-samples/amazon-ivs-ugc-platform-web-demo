import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { useNotif } from '../../../../contexts/Notification';
import { userManagementAPI } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import Button from '../../../../components/Button';
import { LIMIT_EXCEEDED_EXCEPTION } from '../../../../constants';

const RegisterUserRequestConfirmation = ({ username }) => {
  const { notifySuccess, notifyError } = useNotif();

  const resend = async () => {
    const { result, error } = await userManagementAPI.resendVerificationRequest(
      username
    );

    if (result) {
      notifySuccess($content.notification.success.resent_confirmation);
    }

    if (error) {
      const errorNotificationMessage =
        error?.name === LIMIT_EXCEEDED_EXCEPTION
          ? $content.notification.error.resent_confirmation_limit_error
          : $content.notification.error.resent_confirmation_error;
      notifyError(errorNotificationMessage);
    }
  };

  return (
    <div className="sub-page-container">
      <h2>{$content.register_page.verify_your_account}</h2>
      <p className="p1">{$content.register_page.email_link_sent}</p>
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

RegisterUserRequestConfirmation.propTypes = {
  username: PropTypes.string.isRequired
};

export default RegisterUserRequestConfirmation;
