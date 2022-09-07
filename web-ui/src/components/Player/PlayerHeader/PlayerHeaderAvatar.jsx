import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import * as avatars from '../../../assets/avatars';

const PlayerHeaderAvatar = ({ color, avatar }) => (
  <img
    className={clsm(
      [
        'bg-lightMode-gray-extraLight',
        'border-2',
        'dark:bg-darkMode-gray-medium',
        'flex-shrink-0',
        'h-11',
        'rounded-[22px]',
        'transition-all',
        'w-11',
        'z-10'
      ],
      color ? `border-profile-${color}` : 'border-profile'
    )}
    src={avatars[avatar]}
    alt={`${avatar || 'Profile'} avatar`}
    draggable={false}
  />
);

PlayerHeaderAvatar.propTypes = {
  color: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired
};

export default PlayerHeaderAvatar;
