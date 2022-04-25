import { useLocation, useNavigate } from 'react-router-dom';

import { dashboard as $content } from '../../../content';
import { Settings } from '../../../assets/icons';
import { userManagement } from '../../../api';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import SessionNavigator from './SessionNavigator';
import './Header.css';

const Header = () => {
  const { clearUserData } = useUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogOut = () => {
    userManagement.signOut() && clearUserData();
  };

  const handleSettings = () => {
    navigate(pathname === '/settings' ? -1 : '/settings');
  };

  return (
    <header className="header">
      <SessionNavigator />
      <div className="header-buttons">
        <Button
          className="settings-button"
          onClick={handleSettings}
          variant="secondary"
        >
          <Settings />
        </Button>
        <Button onClick={handleLogOut} variant="secondary">
          {$content.header.log_out}
        </Button>
      </div>
    </header>
  );
};

export default Header;
