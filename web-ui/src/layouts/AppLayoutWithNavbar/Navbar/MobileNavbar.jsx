import { app as $appContent } from '../../../content';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import './Navbar.css';

const $content = $appContent.navbar;

const MobileNavbar = () => {
  const { isSessionValid } = useUser();

  return (
    !isSessionValid && (
      <nav className="mobile-navbar">
        <div className="sidebar-user-buttons">
          <Button type="nav" variant="secondary" to="/login">
            {$content.log_in}
          </Button>
          <Button type="nav" variant="primary" to="/register">
            {$content.sign_up}
          </Button>
        </div>
      </nav>
    )
  );
};

export default MobileNavbar;
