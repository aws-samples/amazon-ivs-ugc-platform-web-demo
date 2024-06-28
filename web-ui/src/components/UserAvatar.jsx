import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../utils';
import { PROFILE_COLORS } from '../constants';

const UserAvatar = ({
  avatarSrc = '',
  className = '',
  profileColor = 'default',
  size = 'lg',
  isOffline = false
}) => {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const onError = useCallback(() => {
    setHasAvatarError(true);
  }, []);

  let dimensions;
  if (size === 'md') dimensions = ['h-8', 'w-8'];
  if (size === 'sm') dimensions = ['h-6', 'w-6'];
  if (size === 'lg') dimensions = ['h-11', 'w-11'];
  if (size === 'xl') dimensions = ['h-[100px]', 'w-[100px]'];

  const avatarClassNames = clsm([
    'bg-lightMode-gray-extraLight',
    'dark:bg-darkMode-gray-medium',
    'hover:bg-lightMode-gray-extraLight-hover',
    'hover:dark:bg-darkMode-gray-medium-hover',
    'shrink-0',
    'ring-2',
    'rounded-[50%]',
    'transition-all',
    `ring-profile-${profileColor}`,
    profileColor === 'white' && 'ring-white',
    dimensions,
    className
  ]);

  return !hasAvatarError && !!avatarSrc ? (
    <img
      className={clsm([avatarClassNames, isOffline && 'grayscale'])}
      src={avatarSrc}
      onError={onError}
      alt=""
      draggable={false}
    />
  ) : (
    <div className={avatarClassNames} />
  );
};

UserAvatar.propTypes = {
  avatarSrc: PropTypes.string,
  className: PropTypes.string,
  isOffline: PropTypes.bool,
  profileColor: PropTypes.oneOf([...PROFILE_COLORS, 'default', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
};

export default UserAvatar;
