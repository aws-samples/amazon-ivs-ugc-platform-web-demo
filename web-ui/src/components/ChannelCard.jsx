import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm, isTextColorInverted } from '../utils';
import { PROFILE_COLORS } from '../constants';
import { useResponsiveDevice } from '../contexts/ResponsiveDevice';
import UserAvatar from './UserAvatar';

const ChannelCard = ({ avatar, color, username }) => {
  const { isTouchscreenDevice } = useResponsiveDevice();
  const [shouldHavePointerEvents, setShouldHavePointerEvents] = useState(false);

  useEffect(() => {
    // Addresses a potential issue on iOS where, after signin, the first card would get the hover state.
    setShouldHavePointerEvents(true);
  }, []);

  return (
    <Link
      className={clsm([
        'button',
        'flex-col',
        'flex',
        'group',
        'transition-transform',
        'w-auto',
        !isTouchscreenDevice && 'hover:scale-110',
        shouldHavePointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
      ])}
      to={`/${username}`}
    >
      <div
        className={clsm([
          '-mb-[1px]',
          'aspect-video',
          'rounded-t-xl',
          'transition-colors',
          `bg-profile-${color}-dark`,
          `dark:group-hover:bg-profile-${color}-darkMode-dark-hover`,
          `group-hover:bg-profile-${color}-lightMode-dark-hover`
        ])}
      ></div>
      <div
        className={clsm([
          'flex',
          'items-center',
          'p-4',
          'rounded-b-xl',
          'space-x-4',
          'transition-colors',
          `bg-profile-${color}`,
          `group-hover:bg-profile-${color}-lightMode-primary-hover`,
          `dark:group-hover:bg-profile-${color}-darkMode-primary-hover`
        ])}
      >
        <UserAvatar avatarName={avatar} profileColor="white" />
        <h3
          className={clsm([
            'truncate',
            'text-black',
            isTextColorInverted(color) && 'text-white'
          ])}
        >
          {username}
        </h3>
      </div>
    </Link>
  );
};

ChannelCard.propTypes = {
  avatar: PropTypes.string,
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  username: PropTypes.string
};

ChannelCard.defaultProps = {
  avatar: '',
  color: 'default',
  username: ''
};

export default ChannelCard;
