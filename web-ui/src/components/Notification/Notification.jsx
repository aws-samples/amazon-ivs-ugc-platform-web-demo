import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Check, ErrorIcon } from '../../assets/icons';
import {
  useNotif,
  NOTIF_ANIMATION_DURATION_MS
} from '../../contexts/Notification';
import { clsm } from '../../utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';

const Notification = ({ position }) => {
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid } = useUser();
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
          className={clsm([
            'notification',
            'left-0',
            'my-0',
            'mx-auto',
            'max-w-[595px]',
            'py-0',
            'px-4',
            'sticky',
            'right-0',
            'top-[79px]',
            'w-fit',
            'z-50',
            position,
            !isMobileView && isSessionValid && ['left-16'], // Account for the authenticated sidebar
            !isMobileView &&
              !isSessionValid && ['left-60', 'lg:portrait:left-40'] // Account for the unauthenticated sidebar
          ])}
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
          <div
            className={clsm([
              'dark:text-black',
              'flex',
              'font-bold',
              'gap-x-[11.5px]',
              'items-center',
              'leading-[18px]',
              'px-[20px]',
              'py-[10px]',
              'rounded-3xl',
              'text-white',
              notif.type === 'error' && [
                'bg-lightMode-red',
                'dark:bg-darkMode-red'
              ],
              notif.type === 'success' && [
                'bg-lightMode-green',
                'dark:bg-darkMode-green'
              ]
            ])}
          >
            <NotifIcon
              className={clsm(['dark:fill-black', 'fill-white', 'shrink-0'])}
            />
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
