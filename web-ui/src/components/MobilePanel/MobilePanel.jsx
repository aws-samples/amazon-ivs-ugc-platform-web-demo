import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import useFocusTrap from '../../hooks/useFocusTrap';
import useMobileOverlay from '../../hooks/useMobileOverlay';
import withPortal from '../withPortal';
import './MobilePanel.css';

const MobilePanel = ({ children }) => {
  const headerRef = useRef();
  const panelRef = useRef();

  useEffect(() => {
    headerRef.current = document.getElementsByClassName('header')[0];
  }, []);

  useMobileOverlay();
  useFocusTrap([headerRef, panelRef]);

  return (
    <div ref={panelRef} className="mobile-panel">
      {children}
    </div>
  );
};

MobilePanel.propTypes = { children: PropTypes.node.isRequired };

export default withPortal(MobilePanel, 'mobile-panel');
