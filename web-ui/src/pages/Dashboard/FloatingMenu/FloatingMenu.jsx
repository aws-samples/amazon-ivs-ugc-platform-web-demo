import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';

import { Logout, Settings, Home } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import useClickAway from '../../../hooks/useClickAway';
import './FloatingMenu.css';

const defaultAnimationProps = {
  initial: 'collapsed',
  animate: 'expanded',
  exit: 'collapsed',
  variants: {
    collapsed: { opacity: 0 },
    expanded: { opacity: 1 }
  }
};

const FloatingMenu = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const { logOut } = useUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigateType = useNavigationType();
  const floatingMenuRef = useRef();

  const hideSettings = pathname === '/settings';
  const toggleMenu = () => setIsExpanded(!isExpanded);

  const handleSettings = () => {
    navigate('/settings');
    setIsReset(false);
  };

  const handleHome = () => {
    if (navigateType === 'PUSH') {
      navigate(-1); // Return to the previously monitored session on the dashboard
    } else {
      navigate('/dashboard'); // Navigate to the dashboard and start monitoring the latest session
    }

    setIsReset(false);
  };

  const handleBlur = ({ currentTarget }) => {
    setTimeout(() => {
      const focusedEl = document.activeElement;
      if (!currentTarget.contains(focusedEl)) setIsExpanded(false);
    });
  };

  useClickAway([floatingMenuRef], () => setIsExpanded(false));

  useEffect(() => {
    setIsExpanded(false);
    setIsReset(true);
  }, [pathname]);

  return (
    <div ref={floatingMenuRef} className="floating-menu" onBlur={handleBlur}>
      <Button
        onFocus={() => setIsExpanded(true)}
        className="icon-button"
        onMouseDown={toggleMenu}
        variant="secondary"
      >
        <div
          className={`hamburger hamburger--squeeze ${
            isExpanded ? 'is-active' : ''
          }`}
          type="button"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner" />
          </span>
        </div>
      </Button>
      {isReset && (
        <AnimatePresence>
          {isExpanded && (
            <m.div
              {...defaultAnimationProps}
              className="action-buttons"
              key="action-buttons"
              transition={{ duration: 0.25, type: 'tween' }}
            >
              <Button
                className="icon-button"
                onClick={hideSettings ? handleHome : handleSettings}
                variant="secondary"
              >
                {hideSettings ? <Home /> : <Settings />}
              </Button>
              <Button
                className="icon-button"
                onClick={logOut}
                variant="destructive"
              >
                <Logout />
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default FloatingMenu;
