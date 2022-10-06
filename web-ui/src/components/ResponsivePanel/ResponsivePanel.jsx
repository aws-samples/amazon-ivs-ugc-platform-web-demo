import { AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import MobilePanel from './MobilePanel';

const ResponsivePanel = ({
  children,
  containerClasses,
  isOpen,
  mobileBreakpoint,
  panelId,
  preserveVisible,
  slideInDirection
}) => {
  const { currentBreakpoint } = useResponsiveDevice();
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
            containerClasses={containerClasses}
            controls={controls}
            isOpen
            panelId={panelId}
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
  containerClasses: '',
  isOpen: false,
  mobileBreakpoint: BREAKPOINTS.md,
  preserveVisible: false,
  slideInDirection: 'right'
};

ResponsivePanel.propTypes = {
  children: PropTypes.node.isRequired,
  containerClasses: PropTypes.string,
  isOpen: PropTypes.bool,
  mobileBreakpoint: PropTypes.oneOf(Object.values(BREAKPOINTS)),
  panelId: PropTypes.string.isRequired,
  preserveVisible: PropTypes.bool,
  slideInDirection: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
};

export default ResponsivePanel;
