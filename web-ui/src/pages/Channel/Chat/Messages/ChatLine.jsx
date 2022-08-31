import PropTypes from 'prop-types';
import { decode } from 'html-entities';
import { m } from 'framer-motion';

import { clsm } from '../../../../utils';
import * as avatars from '../../../../assets/avatars';

const defaultTransition = { duration: 0.25, type: 'tween' };

const ChatLine = ({ message, avatar, color, displayName }) => (
  <m.div
    animate="visible"
    initial="hidden"
    exit="hidden"
    variants={{
      visible: { opacity: 1, scale: 1 },
      hidden: { opacity: 0, scale: 0.9 }
    }}
    transition={defaultTransition}
    className={clsm([
      'flex',
      'flex-row',
      'items-start',
      'gap-x-1.5',
      'rounded-3xl',
      'py-2.5',
      'px-3.5',
      'w-full',
      'bg-lightMode-gray-extraLight',
      'dark:bg-darkMode-gray-medium',
      'w-auto',
      'max-w-full',
      'origin-top-left'
    ])}
  >
    <img
      className={clsm(
        ['w-7', 'h-7', 'rounded-[14px]', 'border-2'],
        color ? `border-profile-${color}` : 'border-profile'
      )}
      src={avatars[avatar]}
      alt={`${avatar || 'Profile'} avatar`}
      draggable={false}
    />
    <p
      className={clsm([
        'p1',
        'break-words',
        'text-left',
        'text-black',
        'dark:text-darkMode-gray-light',
        'my-0.5',
        'min-w-0'
      ])}
    >
      <b>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</b>
      &nbsp;
      {decode(message).replace(/\\/g, '\\\\')}
    </p>
  </m.div>
);

ChatLine.propTypes = {
  message: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired
};

export default ChatLine;
