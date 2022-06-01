import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { m } from 'framer-motion';

import useFocusTrap from '../../../hooks/useFocusTrap';
import useMobileOverlay from '../../../hooks/useMobileOverlay';
import withPortal from '../../withPortal';
import './MobilePanel.css';

const MobilePanel = ({ children, controls }) => {
  const headerRef = useRef();
  const panelRef = useRef();

  useEffect(() => {
    headerRef.current = document.getElementsByClassName('header')[0];
  }, []);

  useMobileOverlay();
  useFocusTrap([headerRef, panelRef]);

  return (
    <m.div
      animate={controls}
      initial="hidden"
      exit="hidden"
      variants={{ hidden: { x: '100%' }, visible: { x: 0 } }}
      transition={{ duration: 0.25, type: 'tween' }}
      className="mobile-panel"
      ref={panelRef}
    >
      {children}
    </m.div>
  );
};

MobilePanel.propTypes = {
  children: PropTypes.node.isRequired,
  controls: PropTypes.object.isRequired
};

export default withPortal(MobilePanel, 'mobile-panel', true);
