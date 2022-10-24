import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { clsm } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useStreams } from '../../contexts/Streams';
import Header from './Header';
import NavigatorPopup from './NavigatorPopup';
import ResponsivePanel from '../../components/ResponsivePanel';
import StreamSession from './StreamSession';
import useClickAway from '../../hooks/useClickAway';
import useFocusTrap from '../../hooks/useFocusTrap';
import useScrollToTop from '../../hooks/useScrollToTop';

const emptyRef = { current: undefined };

const StreamHealth = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const { pathname } = useLocation();
  const navPopupRef = useRef();
  const headerNavRefs = useRef();
  const { headerRef = emptyRef, navButtonRef = emptyRef } =
    headerNavRefs.current || {};
  const toggleNavPopup = useCallback(
    (value = null) => setIsNavOpen((prev) => (value === null ? !prev : value)),
    []
  );

  useClickAway([navPopupRef, navButtonRef], () => setIsNavOpen(false));
  useFocusTrap([headerRef, navPopupRef], isNavOpen);
  useScrollToTop({
    dependency: activeStreamSession?.streamId,
    isResponsiveView: isDefaultResponsiveView
  });

  useEffect(() => setIsNavOpen(false), [pathname]);

  useEffect(() => {
    const handleCloseNav = (event) => {
      if (event.key === 'Escape') {
        setIsNavOpen(false);
        navButtonRef.current.focus();
      }
    };

    if (isNavOpen) document.addEventListener('keydown', handleCloseNav);

    return () => document.removeEventListener('keydown', handleCloseNav);
  }, [isNavOpen, navButtonRef]);

  return (
    <>
      <Header
        isNavOpen={isNavOpen}
        ref={headerNavRefs}
        toggleNavPopup={toggleNavPopup}
      />
      <StreamSession />
      <ResponsivePanel
        containerClasses={clsm(['top-16'])}
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

export default StreamHealth;
