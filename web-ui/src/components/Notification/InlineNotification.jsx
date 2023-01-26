import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { NOTIF_TYPES } from '../../contexts/Notification';

const InlineNotification = ({
  animationProps,
  className,
  Icon,
  message,
  type
}) => (
  <motion.div
    aria-live="polite"
    className={clsm([
      'absolute',
      'justify-center',
      'left-0',
      'max-w-[595px]',
      'mx-auto',
      'my-0',
      'notification',
      'px-4',
      'py-0',
      'right-0',
      'top-[32px]',
      'w-fit',
      'z-[400]',
      className
    ])}
    data-testid={`${type}-notification`}
    {...animationProps}
  >
    <div
      className={clsm([
        'dark:text-black',
        'flex',
        'font-bold',
        'space-x-[11.5px]',
        'items-center',
        'leading-[18px]',
        'px-[20px]',
        'py-[10px]',
        'rounded-3xl',
        'text-white',
        type === NOTIF_TYPES.ERROR && [
          'bg-lightMode-red',
          'dark:bg-darkMode-red'
        ],
        type === NOTIF_TYPES.SUCCESS && [
          'bg-lightMode-green',
          'dark:bg-darkMode-green'
        ],
        type === NOTIF_TYPES.INFO && [
          'bg-lightMode-turquoise',
          'dark:bg-darkMode-turquoise'
        ]
      ])}
    >
      {Icon && (
        <Icon className={clsm(['dark:fill-black', 'fill-white', 'shrink-0'])} />
      )}
      <p>{message}</p>
    </div>
  </motion.div>
);

InlineNotification.propTypes = {
  animationProps: PropTypes.object.isRequired,
  className: PropTypes.string,
  Icon: PropTypes.elementType,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(NOTIF_TYPES)).isRequired
};

InlineNotification.defaultProps = { className: '', Icon: null };

export default InlineNotification;
