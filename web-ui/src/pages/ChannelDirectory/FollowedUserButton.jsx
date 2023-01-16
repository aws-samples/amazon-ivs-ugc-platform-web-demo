import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { PROFILE_COLORS } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import LivePill from '../../components/LivePill';
import UserAvatar from '../../components/UserAvatar';

const FollowedUserButton = ({ avatarSrc, color, isLive, username }) => {
  const { isTouchscreenDevice } = useResponsiveDevice();

  return (
    <Link
      className={clsm(['button', 'flex-col', 'flex', 'group', 'w-auto'])}
      to={`/${username}`}
    >
      <div className={clsm(['flex-col', 'flex'])}>
        <div className={clsm(['flex-col', 'flex', 'items-center', 'relative'])}>
          <UserAvatar
            avatarSrc={avatarSrc}
            className={clsm([
              'aspect-square',
              'h-auto',
              'ring-4',
              'w-full',
              !isTouchscreenDevice && [
                'group-hover:ring-[6px]',
                'group-hover:scale-110',
                'transition-all'
              ],
              !isLive && [
                'dark:group-hover:ring-darkMode-gray',
                'dark:ring-darkMode-gray',
                'group-hover:ring-lightMode-gray',
                'ring-lightMode-gray',
                'grayscale'
              ]
            ])}
            profileColor={color}
          />
          {isLive && (
            <LivePill
              className={clsm([
                'absolute',
                'bottom-2',
                'px-1.5',
                'py-0.5',
                !isTouchscreenDevice && [
                  'group-hover:translate-y-2',
                  'transition-transform'
                ]
              ])}
            />
          )}
        </div>
        {username && (
          <h3
            className={clsm([
              'dark:group-hover:text-white',
              'dark:text-darkMode-gray-light',
              'group-hover:text-black',
              'mt-4',
              'mx-auto',
              'text-center',
              'text-lightMode-gray-medium',
              'transition-colors',
              'truncate',
              'w-full'
            ])}
          >
            {username}
          </h3>
        )}
      </div>
    </Link>
  );
};

FollowedUserButton.defaultProps = {
  avatarSrc: '',
  color: 'default',
  isLive: false,
  username: ''
};

FollowedUserButton.propTypes = {
  avatarSrc: PropTypes.string,
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default', 'white']),
  isLive: PropTypes.bool,
  username: PropTypes.string
};

export default FollowedUserButton;
