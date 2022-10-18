import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { clsm } from '../../../utils';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import NavigatorPopup from './NavigatorPopup';
import ResponsivePanel from '../../../components/ResponsivePanel';
import SessionNavigator from './SessionNavigator';
import useClickAway from '../../../hooks/useClickAway';
import useFocusTrap from '../../../hooks/useFocusTrap';

const Header = () => {
  const { isMobileView } = useResponsiveDevice();
  const { pathname } = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
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
      <header
        className={clsm([
          'bg-white',
          'dark:bg-black',
          'space-x-4',
          'grid-cols-[1fr_minmax(auto,654px)_1fr]',
          'grid',
          'h-16',
          'md:grid-cols-[1fr_minmax(auto,468px)_1fr]',
          'relative',
          'top-0',
          'w-[calc(100vw-64px)]',
          'z-[520]',
          isMobileView && 'w-screen'
        ])}
        id="stream-health-header"
        ref={headerRef}
      >
        <SessionNavigator
          ref={navButtonRef}
          isNavOpen={isNavOpen}
          toggleNavPopup={toggleNavPopup}
        />
      </header>
      <ResponsivePanel
        containerClasses={clsm(['top-16', 'z-[510]'])}
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
