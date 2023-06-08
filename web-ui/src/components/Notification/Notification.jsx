import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Check, ErrorIcon } from '../../assets/icons';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import { NOTIF_TYPES, useNotif } from '../../contexts/Notification';
import InlineNotification from './InlineNotification';
import PortalNotification from './PortalNotification';
import useCurrentPage from '../../hooks/useCurrentPage';
import usePrevious from '../../hooks/usePrevious';
import useStateWithCallback from '../../hooks/useStateWithCallback';

const Notification = ({ className }) => {
  const { notif, dismissNotif } = useNotif();
  const { asPortal, message, type } = notif || {};
  const [shouldAnimateOut, setShouldAnimateOut] = useStateWithCallback(true);
  const currPage = useCurrentPage();
  const prevPage = usePrevious(currPage);
  const isOpen = !!notif;

  let NotifIcon = null;
  if (type === NOTIF_TYPES.ERROR) NotifIcon = ErrorIcon;
  if (type === NOTIF_TYPES.SUCCESS) NotifIcon = Check;
  const props = {
    type,
    message,
    className,
    key: `${type}-${message}`,
    Icon: NotifIcon,
    animationProps: createAnimationProps({
      animations: ['fadeIn-full'],
      customVariants: {
        hidden: { y: '-25px' },
        visible: { y: 0 }
      },
      options: { shouldAnimateOut }
    })
  };

  // Skip the exit animation if the dismissal is triggered by a page change
  useEffect(() => {
    if (notif && currPage && prevPage && currPage !== prevPage) {
      setShouldAnimateOut(false, dismissNotif);
    }
  }, [dismissNotif, currPage, prevPage, setShouldAnimateOut, notif]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setShouldAnimateOut(true)}
    >
      {asPortal ? (
        <PortalNotification isOpen={isOpen} {...props} />
      ) : (
        isOpen && <InlineNotification {...props} />
      )}
    </AnimatePresence>
  );
};

Notification.propTypes = { className: PropTypes.string };

Notification.defaultProps = { className: '' };

export default Notification;
