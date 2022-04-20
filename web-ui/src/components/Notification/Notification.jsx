import { m, AnimatePresence } from 'framer-motion';

import { Check, Error } from '../../assets/icons';
import { useNotif } from '../../contexts/Notification';
import './Notification.css';

const Notification = () => {
  const { NOTIF_TYPES, notif } = useNotif();

  let NotifIcon = null;
  if (notif?.type === NOTIF_TYPES.ERROR) NotifIcon = Error;
  if (notif?.type === NOTIF_TYPES.SUCCESS) NotifIcon = Check;

  return (
    <AnimatePresence exitBeforeEnter>
      {notif && (
        <m.div
          key={`${notif.type}-notification`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: -25 }
          }}
          transition={{ duration: 0.25, type: 'tween' }}
          className={`notification ${notif.type}`}
        >
          <NotifIcon className="notif-icon" />
          {notif.message}
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
