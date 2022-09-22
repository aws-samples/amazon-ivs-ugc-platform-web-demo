import { m, usePresence } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import useFocusTrap from '../../hooks/useFocusTrap';
import withPortal from '../withPortal';

const MobilePanel = ({ children, controls, panelId, slideInDirection }) => {
  const { addMobileOverlay, removeMobileOverlay } = useResponsiveDevice();
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
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    headerRef.current = document.getElementsByClassName('header')[0];
  }, []);

  useEffect(() => {
    addMobileOverlay(panelId);
  }, [addMobileOverlay, panelId]);

  useEffect(() => {
    if (!isPresent) {
      removeMobileOverlay(panelId);
      safeToRemove();
    }
  }, [isPresent, panelId, removeMobileOverlay, safeToRemove]);

  useFocusTrap([headerRef, panelRef]);

  return (
    <m.div
      ref={panelRef}
      className={clsm(['absolute', 'h-full', 'w-full', 'pointer-events-auto'])}
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
  panelId: PropTypes.string.isRequired,
  slideInDirection: PropTypes.string.isRequired
};

export default withPortal(MobilePanel, 'mobile-panel', {
  isAnimated: true,
  containerClasses: clsm([
    'fixed',
    'w-screen',
    'h-full',
    'z-[500]',
    'top-0',
    'left-0',
    'pointer-events-none',
    'bg-transparent'
  ])
});
