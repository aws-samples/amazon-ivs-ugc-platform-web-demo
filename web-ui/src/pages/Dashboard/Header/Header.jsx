import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../content';
import { Settings } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import NavigatorPopup from './NavigatorPopup';
import ResponsivePanel from '../../../components/ResponsivePanel';
import SessionNavigator from './SessionNavigator';
import useClickAway from '../../../hooks/useClickAway';
import useFocusTrap from '../../../hooks/useFocusTrap';
import './Header.css';

const $content = $dashboardContent.header;

const Header = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const headerRef = useRef();
  const navButtonRef = useRef();
  const navPopupRef = useRef();
  const { isMobileView } = useMobileBreakpoint();
  const { logOut } = useUser();

  const handleSettings = () => {
    navigate(pathname === '/settings' ? -1 : '/settings');
  };

  const toggleNavPopup = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleCloseNav = (event) => {
      if (event.keyCode === 27) {
        setIsNavOpen(false);
        navButtonRef.current.focus();
      }
    };

    if (isNavOpen) document.addEventListener('keydown', handleCloseNav);

    return () => document.removeEventListener('keydown', handleCloseNav);
  }, [isNavOpen]);

  useClickAway([navPopupRef, navButtonRef], () => setIsNavOpen(false));
  useFocusTrap([headerRef, navPopupRef], isNavOpen);

  return (
    <>
      <header ref={headerRef} className="header">
        <SessionNavigator
          ref={navButtonRef}
          isNavOpen={isNavOpen}
          toggleNavPopup={toggleNavPopup}
        />
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
      <ResponsivePanel
        isOpen={isNavOpen}
        preserveVisible
        slideInDirection="top"
      >
        <NavigatorPopup
          ref={navPopupRef}
          isNavOpen={isNavOpen}
          toggleNavPopup={toggleNavPopup}
        />
      </ResponsivePanel>
    </>
  );
};

export default Header;
