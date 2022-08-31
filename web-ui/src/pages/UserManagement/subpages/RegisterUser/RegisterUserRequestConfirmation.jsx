import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { LIMIT_EXCEEDED_EXCEPTION } from '../../../../constants';
import { useNotif } from '../../../../contexts/Notification';
import { userManagement as $content } from '../../../../content';
import { userManagementAPI } from '../../../../api';
import Button from '../../../../components/Button';

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
    <div
      className={clsm([
        'items-center',
        'flex',
        'flex-col',
        'm-auto',
        'text-center',
        'max-w-[450px]',
        'gap-y-[45px]'
      ])}
    >
      <h2>{$content.register_page.verify_your_account}</h2>
      <p className={clsm(['pt-[3px]', 'p1'])}>
        {$content.register_page.email_link_sent}
      </p>
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
