import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { AnimatePresence, useAnimation } from 'framer-motion';

import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import MobilePanel from './MobilePanel';

const ResponsivePanel = ({
  slideInDirection,
  children,
  isOpen,
  preserveVisible
}) => {
  const { isMobileView } = useMobileBreakpoint();
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) controls.start('visible');
  }, [controls, isOpen]);

  useEffect(() => {
    if (preserveVisible && isOpen) controls.set('visible');
  }, [controls, isOpen, preserveVisible, isMobileView]);

  return (
    <AnimatePresence>
      {isOpen &&
        (isMobileView ? (
          <MobilePanel
            controls={controls}
            isOpen={isOpen}
            slideInDirection={slideInDirection}
          >
            {children}
          </MobilePanel>
        ) : (
          children
        ))}
    </AnimatePresence>
  );
};

ResponsivePanel.defaultProps = {
  isOpen: false,
  preserveVisible: false,
  slideInDirection: 'right'
};

ResponsivePanel.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool,
  preserveVisible: PropTypes.bool,
  slideInDirection: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
};

export default ResponsivePanel;
