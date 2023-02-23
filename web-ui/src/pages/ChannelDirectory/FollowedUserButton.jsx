import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { FIRST_ITEM_IN_FRAME, LAST_ITEM_IN_FRAME } from './FollowingSection';
import { PROFILE_COLORS } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import LivePill from '../../components/LivePill';
import UserAvatar from '../../components/UserAvatar';

const FollowedUserButton = forwardRef(
  (
    {
      avatarSrc,
      color,
      isLive,
      username,
      isLastItemInFrame,
      isFirstItemInFrame,
      avatarsPerFrame
    },
    firstAndLastItemInFrameRef
  ) => {
    const { isTouchscreenDevice } = useResponsiveDevice();

    return (
      <Link
        ref={(el) => {
          if (el?.href) {
            if (!firstAndLastItemInFrameRef.current[avatarsPerFrame]) {
              firstAndLastItemInFrameRef.current[avatarsPerFrame] = {
                [FIRST_ITEM_IN_FRAME]: new Set(),
                [LAST_ITEM_IN_FRAME]: new Set()
              };
            }

            if (isFirstItemInFrame) {
              firstAndLastItemInFrameRef.current[avatarsPerFrame][
                FIRST_ITEM_IN_FRAME
              ].add(el.href);
            }

            if (isLastItemInFrame) {
              firstAndLastItemInFrameRef.current[avatarsPerFrame][
                LAST_ITEM_IN_FRAME
              ].add(el.href);
            }
          }
        }}
        className={clsm([
          'button',
          'flex-col',
          'flex',
          'group',
          'w-auto',
          'focus:outline-none'
        ])}
        to={`/${username}`}
      >
        <div className={clsm(['flex-col', 'flex'])}>
          <div
            className={clsm(['flex-col', 'flex', 'items-center', 'relative'])}
          >
            <UserAvatar
              avatarSrc={avatarSrc}
              className={clsm([
                'group-focus:ring-[6px]',
                'group-focus:ring-white',
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
                  !isTouchscreenDevice && [
                    'group-hover:bottom-[calc(0.5rem_-_5%)]',
                    'transition-all'
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
  }
);

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
  isLastItemInFrame: PropTypes.bool.isRequired,
  isFirstItemInFrame: PropTypes.bool.isRequired,
  avatarsPerFrame: PropTypes.number.isRequired,
  username: PropTypes.string
};

export default FollowedUserButton;
