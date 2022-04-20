import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Button from '../../../../components/Button';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useNotif } from '../../../../contexts/Notification';

const ResetPasswordRequestConfirmation = ({ email }) => {
  const { notifySuccess, notifyError } = useNotif();

  const resend = async () => {
    const userData = { email };
    const { result, error } = await userManagement.sendResetPasswordRequest(
      userData
    );

    if (result) {
      notifySuccess($content.notification.success.resent_confirmation);
    }

    if (error) {
      notifyError($content.notification.error.unexpected_error);
    }
  };

  return (
    <div className="sub-page-container">
      <h2>{$content.reset_password_page.title}</h2>
      <p>{$content.reset_password_page.email_link_sent}</p>
      <span>
        <b>{$content.reset_password_page.did_not_receive_email}</b>&nbsp;
        <Button onClick={resend} type="button" variant="link">
          {$content.reset_password_page.resend}
        </Button>
      </span>
      <Link to="/login">{$content.reset_password_page.return_to_login}</Link>
    </div>
  );
};

ResetPasswordRequestConfirmation.propTypes = {
  email: PropTypes.string.isRequired
};

export default ResetPasswordRequestConfirmation;
