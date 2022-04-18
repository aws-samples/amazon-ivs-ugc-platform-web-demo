import { Link } from 'react-router-dom';

import Button from '../../../../components/Button';
import { userManagement } from '../../../../api';
import { userManagement as $content } from '../../../../content';

const ResetPasswordRequestConfirmation = () => (
  <div className="sub-page-container">
    <h2>{$content.reset_password_page.title}</h2>
    <p>{$content.reset_password_page.email_link_sent}</p>
    <span>
      <b>{$content.reset_password_page.did_not_receive_email}</b>&nbsp;
      <Button
        onClick={userManagement.sendResetPasswordRequest}
        type="button"
        variant="link"
      >
        {$content.reset_password_page.resend}
      </Button>
    </span>
    <Link to="/login">{$content.reset_password_page.return_to_login}</Link>
  </div>
);

export default ResetPasswordRequestConfirmation;
