import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { AnimatePresence, useAnimation } from 'framer-motion';

import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import MobilePanel from './MobilePanel';

const ResponsivePanel = ({ children, isOpen }) => {
  const { isMobileView } = useMobileBreakpoint();
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) controls.start('visible');
  }, [controls, isOpen]);

  return (
    <AnimatePresence>
      {isOpen &&
        (isMobileView ? (
          <MobilePanel controls={controls} isOpen={isOpen}>
            {children}
          </MobilePanel>
        ) : (
          children
        ))}
    </AnimatePresence>
  );
};

ResponsivePanel.defaultProps = { isOpen: false };

ResponsivePanel.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool
};

export default ResponsivePanel;
