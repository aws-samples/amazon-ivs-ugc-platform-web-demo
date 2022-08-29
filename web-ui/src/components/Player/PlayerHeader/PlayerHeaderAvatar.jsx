import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import * as avatars from '../../../assets/avatars';

const PlayerHeaderAvatar = ({ color, avatar }) => {
  return (
    <div className={clsm(['z-10'])}>
      <img
        className={clsm(
          [
            'border-2',
            'w-11',
            'h-11',
            'rounded-[22px]',
            'transition-all',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium'
          ],
          color ? `border-profile-${color}` : 'border-profile'
        )}
        src={avatars[avatar]}
        alt={`${avatar || 'Profile'} avatar`}
        draggable={false}
      />
    </div>
  );
};

PlayerHeaderAvatar.propTypes = {
  color: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired
};

export default PlayerHeaderAvatar;
