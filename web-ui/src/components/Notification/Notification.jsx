import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Check, ErrorIcon } from '../../assets/icons';
import {
  useNotif,
  NOTIF_ANIMATION_DURATION_MS
} from '../../contexts/Notification';
import './Notification.css';

const Notification = ({ position }) => {
  const { NOTIF_TYPES, notif } = useNotif();

  let NotifIcon = null;
  if (notif?.type === NOTIF_TYPES.ERROR) NotifIcon = ErrorIcon;
  if (notif?.type === NOTIF_TYPES.SUCCESS) NotifIcon = Check;

  return (
    <AnimatePresence exitBeforeEnter>
      {notif && (
        <m.div
          animate="visible"
          aria-live="polite"
          className={`notification ${notif.type} ${position}`}
          exit="hidden"
          initial="hidden"
          key={`${notif.type}-notification`}
          transition={{
            duration: NOTIF_ANIMATION_DURATION_MS / 1000,
            type: 'tween'
          }}
          variants={{
            hidden: { opacity: 0, y: -25 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <div>
            <NotifIcon className="notification-icon" />
            {notif.message}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

Notification.defaultProps = { position: 'fixed' };

Notification.propTypes = {
  position: PropTypes.oneOf(['fixed', 'absolute'])
};

export default Notification;
