import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm, isTextColorInverted } from '../utils';
import { PROFILE_COLORS } from '../constants';
import { useResponsiveDevice } from '../contexts/ResponsiveDevice';
import UserAvatar from './UserAvatar';

const ChannelCard = ({ avatarSrc, bannerSrc, color, username }) => {
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
        'dark:focus:ring-white',
        'flex-col',
        'flex',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-black',
        'group',
        'rounded-xl',
        'transition-transform',
        'w-auto',
        !isTouchscreenDevice && 'hover:scale-110',
        shouldHavePointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
      ])}
      to={`/${username}`}
    >
      <div
        {...(bannerSrc
          ? { style: { backgroundImage: `url("${bannerSrc}")` } }
          : {})}
        className={clsm([
          '-mb-[1px]',
          'aspect-video',
          'bg-center',
          'bg-cover',
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
        <UserAvatar avatarSrc={avatarSrc} profileColor="white" />
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
  avatarSrc: PropTypes.string,
  bannerSrc: PropTypes.string,
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  username: PropTypes.string
};

ChannelCard.defaultProps = {
  avatarSrc: '',
  bannerSrc: '',
  color: 'default',
  username: ''
};

export default ChannelCard;
