import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Button from '../../../../components/Button';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';
import { useNotif } from '../../../../contexts/Notification';

const RegisterUserRequestConfirmation = ({ username }) => {
  const { notifySuccess, notifyError } = useNotif();

  const resend = async () => {
    const { result, error } = await userManagement.resendVerificationRequest(
      username
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
      <h2>{$content.register_page.verify_your_account}</h2>
      <p className="p1">{$content.register_page.email_link_sent}</p>
      <span>
        <b>{$content.did_not_receive_email}</b>&nbsp;
        <Button onClick={resend} type="button" variant="link">
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
