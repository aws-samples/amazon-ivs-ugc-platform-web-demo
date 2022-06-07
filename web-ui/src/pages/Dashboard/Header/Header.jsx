import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../content';
import { Settings } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import SessionNavigator from './SessionNavigator';
import './Header.css';

const $content = $dashboardContent.header;

const Header = () => {
  const { isMobileView } = useMobileBreakpoint();
  const { logOut } = useUser();
  const { pathname } = useLocation();
  const headerRef = useRef();
  const navigate = useNavigate();

  const handleSettings = () => {
    navigate(pathname === '/settings' ? -1 : '/settings');
  };

  return (
    <header ref={headerRef} className="header">
      <SessionNavigator headerRef={headerRef} />
      {!isMobileView && (
        <div className="header-buttons">
          <Button
            ariaLabel={$content.settings}
            className="settings-button"
            onClick={handleSettings}
            variant="secondary"
          >
            <Settings className="icon settings" />
          </Button>
          <Button onClick={logOut} variant="secondary">
            {$content.log_out}
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
