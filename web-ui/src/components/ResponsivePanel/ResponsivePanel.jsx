import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { AnimatePresence, useAnimation } from 'framer-motion';

import { BREAKPOINTS } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import MobilePanel from './MobilePanel';

const ResponsivePanel = ({
  slideInDirection,
  children,
  isOpen,
  mobileBreakpoint,
  preserveVisible
}) => {
  const { currentBreakpoint } = useMobileBreakpoint();
  const isResponsiveView = currentBreakpoint < mobileBreakpoint;
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) controls.start('visible');
  }, [controls, isOpen]);

  useEffect(() => {
    if (preserveVisible && isOpen) controls.set('visible');
  }, [controls, isOpen, preserveVisible, isResponsiveView]);

  return (
    <AnimatePresence>
      {isOpen &&
        (isResponsiveView ? (
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
  mobileBreakpoint: BREAKPOINTS.md,
  preserveVisible: false,
  slideInDirection: 'right'
};

ResponsivePanel.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool,
  mobileBreakpoint: PropTypes.oneOf(Object.values(BREAKPOINTS)),
  preserveVisible: PropTypes.bool,
  slideInDirection: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
};

export default ResponsivePanel;
