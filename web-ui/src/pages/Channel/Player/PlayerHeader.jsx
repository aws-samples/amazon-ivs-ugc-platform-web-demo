import { motion } from 'framer-motion';
import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import { usePlayerContext } from '../contexts/Player';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useUser } from '../../../contexts/User';
import FollowButton from './FollowButton';
import PlayerOverlay from './PlayerOverlay';
import UserAvatar from '../../../components/UserAvatar';
import ProfileViewMenu from './ProfileViewMenu';

const HEADER_BUTTON_CLASSES = clsm([
  'flex',
  'items-center',
  'space-x-2',
  'shrink-0',
  'pointer-events-all',
  'z-10'
]);

const PlayerHeader = ({ avatarSrc, color, username }) => {
  const {
    getProfileViewAnimationProps,
    headerAnimationControls,
    isProfileViewAnimationEnabled,
    isProfileViewExpanded,
    shouldAnimateProfileView,
    toggleProfileView
  } = useProfileViewAnimation();
  const {
    isOverlayVisible,
    player: { isLive }
  } = usePlayerContext();
  const { isSessionValid } = useUser();
  const layoutDependency = useRef(null);
  const animationDuration = DEFAULT_PROFILE_VIEW_TRANSITION.duration;
  const shouldShowHeaderOverlay =
    isOverlayVisible || isLive === false || isProfileViewExpanded;

  if (shouldAnimateProfileView.current) layoutDependency.current = Date.now();

  const getPlayerHeaderProfileViewAnimationProps = useCallback(
    (variantStyles) =>
      getProfileViewAnimationProps(headerAnimationControls, variantStyles),
    [getProfileViewAnimationProps, headerAnimationControls]
  );

  return (
    <div
      className={clsm(
        'absolute',
        'w-full',
        'top-0',
        'flex',
        'pt-8',
        'px-8',
        'lg:pt-4',
        'lg:px-4',
        'pointer-events-none',
        'items-center',
        isProfileViewExpanded
          ? ['justify-center', 'flex-col']
          : ['justify-between', 'flex-row']
      )}
    >
      <motion.div
        layout="position"
        layoutDependency={layoutDependency.current}
        className={HEADER_BUTTON_CLASSES}
        {...getPlayerHeaderProfileViewAnimationProps({
          expanded: { y: 64, desktop: { y: 48 } },
          collapsed: { y: 0 }
        })}
      >
        <button
          className={clsm([
            'group',
            'flex',
            'rounded-[50%]',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-white'
          ])}
          disabled={!isProfileViewAnimationEnabled}
          aria-label={`${
            isProfileViewExpanded ? 'Close' : 'Open'
          } profile view`}
          onClick={() => toggleProfileView()}
        >
          <UserAvatar
            className={clsm([
              'duration-[400ms]',
              'group-focus:ring-0',
              isProfileViewAnimationEnabled &&
                (isProfileViewExpanded
                  ? [
                      'group-focus:hover:ring-4',
                      'hover:ring-4',
                      'hover:scale-[calc(27/25)]'
                    ]
                  : [
                      'group-focus:hover:ring',
                      'hover:ring',
                      'hover:scale-[calc(12/11)]'
                    ])
            ])}
            avatarSrc={avatarSrc}
            profileColor={color}
            size={isProfileViewExpanded ? 'xl' : 'lg'}
          />
        </button>
      </motion.div>
      <PlayerOverlay
        isGradientVisible={!isProfileViewExpanded}
        isVisible={shouldShowHeaderOverlay}
        position="top"
      >
        <motion.div
          {...getPlayerHeaderProfileViewAnimationProps({
            expanded: { y: 184, desktop: { y: 168 } },
            collapsed: { y: 0 }
          })}
          className={clsm(
            'flex',
            'items-center',
            'w-full',
            isProfileViewExpanded
              ? ['justify-center', 'flex-col']
              : ['justify-between', 'flex-row']
          )}
        >
          <motion.h3
            {...getPlayerHeaderProfileViewAnimationProps({
              expanded: { marginLeft: 0 },
              collapsed: { marginLeft: 64 }
            })}
            layout="position"
            layoutDependency={layoutDependency.current}
            className={clsm(['truncate', 'text-black', 'dark:text-white'])}
          >
            {username}
          </motion.h3>
          <motion.div
            layout="position"
            layoutDependency={layoutDependency.current}
            className={HEADER_BUTTON_CLASSES}
            {...getPlayerHeaderProfileViewAnimationProps({
              expanded: { marginTop: 24 },
              collapsed: { marginTop: 0 }
            })}
          >
            <motion.div
              {...createAnimationProps({ animations: ['fadeIn-full'] })}
            >
              <FollowButton isExpandedView={isProfileViewExpanded} />
            </motion.div>
            {isSessionValid && (
              <motion.div
                className={clsm(['w-11', 'h-11'])}
                {...getPlayerHeaderProfileViewAnimationProps({
                  expanded: {
                    width: 'auto',
                    opacity: 1,
                    display: 'block',
                    transition: {
                      ...DEFAULT_PROFILE_VIEW_TRANSITION,
                      duration: animationDuration / 2,
                      delay: animationDuration
                    }
                  },
                  collapsed: {
                    width: 0,
                    opacity: 0,
                    transition: {
                      ...DEFAULT_PROFILE_VIEW_TRANSITION,
                      opacity: { duration: animationDuration / 4 }
                    },
                    transitionEnd: { display: 'none' }
                  }
                })}
              >
                <ProfileViewMenu channelUsername={username} />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </PlayerOverlay>
    </div>
  );
};

PlayerHeader.defaultProps = {
  avatarSrc: '',
  color: 'default',
  username: ''
};

PlayerHeader.propTypes = {
  avatarSrc: PropTypes.string,
  color: PropTypes.string,
  username: PropTypes.string
};

export default PlayerHeader;
