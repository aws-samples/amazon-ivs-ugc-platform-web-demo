import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

import './Header.css';
import { BREAKPOINTS } from '../../../constants';
import { dashboard as $dashboardContent } from '../../../content';
import { Logout, Settings } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import NavigatorPopup from './NavigatorPopup';
import ResponsivePanel from '../../../components/ResponsivePanel';
import SessionNavigator from './SessionNavigator';
import useClickAway from '../../../hooks/useClickAway';
import useFocusTrap from '../../../hooks/useFocusTrap';

const $content = $dashboardContent.header;

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { currentBreakpoint } = useMobileBreakpoint();
  const { logOut } = useUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigateType = useNavigationType();
  const headerRef = useRef();
  const navButtonRef = useRef();
  const navPopupRef = useRef();
  const isIconLogoutBtn = currentBreakpoint < BREAKPOINTS.lg;

  const handleSettings = () => {
    if (pathname !== '/settings') {
      navigate('/settings');
    } else {
      if (navigateType === 'PUSH') {
        navigate(-1); // Return to the previously monitored session on the dashboard
      } else {
        navigate('/dashboard'); // Navigate to the dashboard and start monitoring the latest session
      }
    }
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
        {currentBreakpoint >= BREAKPOINTS.md && (
          <div className="header-buttons">
            <Button
              ariaLabel={$content.settings}
              className="header-icon-button"
              onClick={handleSettings}
              variant="secondary"
            >
              <Settings className="icon" />
            </Button>
            <Button
              {...(isIconLogoutBtn ? { className: 'header-icon-button' } : {})}
              onClick={logOut}
              variant="secondary"
            >
              {isIconLogoutBtn ? <Logout className="icon" /> : $content.log_out}
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
