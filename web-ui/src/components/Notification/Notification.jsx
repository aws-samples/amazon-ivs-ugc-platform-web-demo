import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Check, ErrorIcon } from '../../assets/icons';
import {
  NOTIF_ANIMATION_DURATION_MS,
  NOTIF_TYPES,
  useNotif
} from '../../contexts/Notification';
import useCurrentPage from '../../hooks/useCurrentPage';
import usePrevious from '../../hooks/usePrevious';
import useStateWithCallback from '../../hooks/useStateWithCallback';
import InlineNotification from './InlineNotification';
import PortalNotification from './PortalNotification';

const getNotificationAnimationProps = (shouldSkipExitAnimation, type) => ({
  animate: 'visible',
  initial: 'hidden',
  exit: shouldSkipExitAnimation ? '' : 'hidden',
  transition: {
    duration: NOTIF_ANIMATION_DURATION_MS / 1000,
    type: 'tween'
  },
  variants: {
    hidden: { opacity: 0, y: -25 },
    visible: { opacity: 1, y: 0 }
  }
});

const Notification = ({ className }) => {
  const { notif, dismissNotif } = useNotif();
  const { asPortal, message, type } = notif || {};
  const [shouldSkipExitAnimation, setShouldSkipExitAnimation] =
    useStateWithCallback(false);
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
    animationProps: getNotificationAnimationProps(shouldSkipExitAnimation)
  };

  // Skip the exit animation if the dismissal is triggered by a page change
  useEffect(() => {
    if (notif && currPage && prevPage && currPage !== prevPage) {
      setShouldSkipExitAnimation(true, dismissNotif);
    }
  }, [dismissNotif, currPage, prevPage, setShouldSkipExitAnimation, notif]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setShouldSkipExitAnimation(false)}
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
