import { motion, usePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import useFocusTrap from '../../hooks/useFocusTrap';
import withPortal from '../withPortal';

const MobilePanel = ({
  children,
  controls,
  panelId,
  slideInDirection,
  shouldAnimateIn
}) => {
  const { addMobileOverlay, removeMobileOverlay } = useResponsiveDevice();
  const headerRef = useRef();
  const panelRef = useRef();
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    headerRef.current = document.getElementById('stream-health-header');
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
    <motion.div
      data-testid={`mobile-panel-${panelId}`}
      ref={panelRef}
      className={clsm(['absolute', 'h-full', 'w-full', 'pointer-events-auto'])}
      {...createAnimationProps({
        animations: [`slideIn-${slideInDirection}`],
        controls,
        options: {
          shouldAnimateIn
        }
      })}
    >
      {children}
    </motion.div>
  );
};

MobilePanel.defaultProps = {
  shouldAnimateIn: true
};

MobilePanel.propTypes = {
  children: PropTypes.node.isRequired,
  controls: PropTypes.object.isRequired,
  panelId: PropTypes.string.isRequired,
  shouldAnimateIn: PropTypes.bool,
  slideInDirection: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
    .isRequired
};

export default withPortal(MobilePanel, 'mobile-panel', {
  isAnimated: true,
  baseContainerClasses: clsm([
    'fixed',
    'w-screen',
    'h-full',
    'top-0',
    'left-0',
    'pointer-events-none',
    'bg-transparent',
    'z-[500]'
  ])
});
