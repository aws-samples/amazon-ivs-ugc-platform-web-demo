import { app as $appContent } from '../../../content';
import { useUser } from '../../../contexts/User';
import LinkButton from '../../../components/LinkButton';
import './Navbar.css';

const $content = $appContent.navbar;

const MobileNavbar = () => {
  const { isSessionValid } = useUser();

  return (
    <nav className="mobile-navbar">
      {!isSessionValid && (
        <div className="user-mgmt-link-buttons">
          <LinkButton to="/login" variant="secondary">
            {$content.log_in}
          </LinkButton>
          <LinkButton to="/register" variant="primary">
            {$content.sign_up}
          </LinkButton>
        </div>
      )}
    </nav>
  );
};

export default MobileNavbar;
