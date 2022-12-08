import PropTypes from 'prop-types';

import { clsm } from '../utils';
import { PROFILE_COLORS } from '../constants';

const UserAvatar = ({ avatarSrc, profileColor, size }) => {
  const hasAvatar = !!avatarSrc;
  let dimensions = ['h-11', 'w-11'];

  if (size === 'md') dimensions = ['h-8', 'w-8'];
  if (size === 'sm') dimensions = ['h-6', 'w-6'];

  const avatarClassNames = clsm([
    [
      'bg-lightMode-gray-extraLight',
      'dark:bg-darkMode-gray-medium',
      'flex-shrink-0',
      'ring-2',
      'rounded-[22px]',
      'transition-all'
    ],
    `ring-profile-${profileColor}`,
    profileColor === 'white' && 'ring-white',
    dimensions
  ]);

  return hasAvatar ? (
    <img
      className={avatarClassNames}
      src={avatarSrc}
      alt=""
      draggable={false}
    />
  ) : (
    <div className={avatarClassNames}></div>
  );
};

UserAvatar.defaultProps = {
  avatarSrc: '',
  profileColor: 'default',
  size: 'lg'
};

UserAvatar.propTypes = {
  avatarSrc: PropTypes.string,
  profileColor: PropTypes.oneOf([...PROFILE_COLORS, 'default', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default UserAvatar;
