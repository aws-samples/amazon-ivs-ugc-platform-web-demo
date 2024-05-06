import { AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import MobilePanel from './MobilePanel';

const ResponsivePanel = ({
  children,
  containerClasses = '',
  isOpen = false,
  mobileBreakpoint = BREAKPOINTS.md,
  panelId,
  preserveVisible = false,
  slideInDirection = 'right',
  shouldSetVisible = true
}) => {
  const { currentBreakpoint } = useResponsiveDevice();
  const isResponsiveView = currentBreakpoint < mobileBreakpoint;
  const controls = useAnimation();

  useEffect(() => {
    if (!shouldSetVisible) return;

    if (isOpen) controls.start('visible');
  }, [controls, isOpen, shouldSetVisible]);

  useEffect(() => {
    if (!shouldSetVisible) return;

    if (preserveVisible && isOpen) controls.set('visible');
  }, [controls, isOpen, preserveVisible, isResponsiveView, shouldSetVisible]);

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
            shouldAnimateIn={shouldSetVisible}
          >
            {children}
          </MobilePanel>
        ) : (
          children
        ))}
    </AnimatePresence>
  );
};

ResponsivePanel.propTypes = {
  children: PropTypes.node.isRequired,
  containerClasses: PropTypes.string,
  isOpen: PropTypes.bool,
  shouldSetVisible: PropTypes.bool,
  mobileBreakpoint: PropTypes.oneOf(Object.values(BREAKPOINTS)),
  panelId: PropTypes.string.isRequired,
  preserveVisible: PropTypes.bool,
  slideInDirection: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
};

export default ResponsivePanel;
