import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import { m } from 'framer-motion';

import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import useFocusTrap from '../../../hooks/useFocusTrap';
import withPortal from '../../withPortal';
import './MobilePanel.css';

const MobilePanel = ({ children, controls, slideInDirection }) => {
  const { addMobileOverlay, removeMobileOverlay } = useMobileBreakpoint();
  const headerRef = useRef();
  const panelRef = useRef();
  const variants = useMemo(() => {
    switch (slideInDirection) {
      case 'top':
        return { hidden: { y: '-100%' }, visible: { y: 0 } };
      case 'right':
        return { hidden: { x: '100%' }, visible: { x: 0 } };
      case 'bottom':
        return { hidden: { y: '100%' }, visible: { y: 0 } };
      case 'left':
        return { hidden: { x: '-100%' }, visible: { x: 0 } };
      default:
        return;
    }
  }, [slideInDirection]);

  useEffect(() => {
    headerRef.current = document.getElementsByClassName('header')[0];
  }, []);

  useEffect(() => {
    addMobileOverlay();

    return () => removeMobileOverlay();
  }, [addMobileOverlay, removeMobileOverlay]);

  useFocusTrap([headerRef, panelRef]);

  return (
    <m.div
      ref={panelRef}
      className="mobile-panel"
      transition={{ duration: 0.25, type: 'tween' }}
      variants={variants}
      initial="hidden"
      animate={controls}
      exit="hidden"
    >
      {children}
    </m.div>
  );
};

MobilePanel.propTypes = {
  children: PropTypes.node.isRequired,
  controls: PropTypes.object.isRequired,
  slideInDirection: PropTypes.string.isRequired
};

export default withPortal(MobilePanel, 'mobile-panel', true);
