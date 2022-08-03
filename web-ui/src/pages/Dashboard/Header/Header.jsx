import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import './Header.css';
import NavigatorPopup from './NavigatorPopup';
import ResponsivePanel from '../../../components/ResponsivePanel';
import SessionNavigator from './SessionNavigator';
import useClickAway from '../../../hooks/useClickAway';
import useFocusTrap from '../../../hooks/useFocusTrap';

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathname } = useLocation();
  const headerRef = useRef();
  const navButtonRef = useRef();
  const navPopupRef = useRef();

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
      </header>
      <ResponsivePanel
        isOpen={isNavOpen}
        panelId="nav-panel"
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
