import PropTypes from 'prop-types';

import { clsm } from '../utils';
import { PROFILE_COLORS } from '../constants';
import { useCallback, useState } from 'react';

const UserAvatar = ({
  avatarSrc,
  className,
  profileColor,
  size,
  isOffline
}) => {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const onError = useCallback(() => {
    setHasAvatarError(true);
  }, []);
  let dimensions = ['h-11', 'w-11'];

  if (size === 'md') dimensions = ['h-8', 'w-8'];
  if (size === 'sm') dimensions = ['h-6', 'w-6'];

  const avatarClassNames = clsm([
    [
      'bg-lightMode-gray-extraLight',
      'dark:bg-darkMode-gray-medium',
      'flex-shrink-0',
      'ring-2',
      'rounded-[50%]',
      'transition-all'
    ],
    `ring-profile-${profileColor}`,
    profileColor === 'white' && 'ring-white',
    dimensions,
    className
  ]);

  return !hasAvatarError && avatarSrc ? (
    <img
      className={clsm([avatarClassNames, isOffline && 'grayscale'])}
      src={avatarSrc}
      onError={onError}
      alt=""
      draggable={false}
    />
  ) : (
    <div className={avatarClassNames}></div>
  );
};

UserAvatar.defaultProps = {
  avatarSrc: '',
  className: '',
  profileColor: 'default',
  size: 'lg',
  isOffline: false
};

UserAvatar.propTypes = {
  avatarSrc: PropTypes.string,
  className: PropTypes.string,
  profileColor: PropTypes.oneOf([...PROFILE_COLORS, 'default', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  isOffline: PropTypes.bool
};

export default UserAvatar;
