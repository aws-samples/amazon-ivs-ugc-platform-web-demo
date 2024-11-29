import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../../../constants';
import { clsm, noop } from '../../../../utils';
import Modal from '../../../../components/Modal';
import ResponsivePanel from '../../../../components/ResponsivePanel';

const ResponsiveSettings = ({
  children,
  isMobileView = false,
  isLandscape = false,
  onClickAway = noop,
  shouldSetVisible = true
}) => {
  /**
   * We mount/unmount the responsive panel to skip the enter and exit
   * animations when switching between desktop and mobile views
   */
  return isMobileView ? (
    <ResponsivePanel
      isOpen
      mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
      panelId="product-learn-more-panel"
      shouldSetVisible={shouldSetVisible}
    >
      {children}
    </ResponsivePanel>
  ) : (
    <Modal
      isOpen
      className={clsm([
        'bg-white',
        'dark:bg-darkMode-gray-medium',
        'max-w-[440px]',
        'p-0',
        'relative',
        'w-full'
      ])}
      onClickAway={onClickAway}
    >
      {children}
    </Modal>
  );
};

ResponsiveSettings.propTypes = {
  children: PropTypes.node.isRequired,
  isMobileView: PropTypes.bool,
  isLandscape: PropTypes.bool,
  onClickAway: PropTypes.func,
  shouldSetVisible: PropTypes.bool
};

export default ResponsiveSettings;
