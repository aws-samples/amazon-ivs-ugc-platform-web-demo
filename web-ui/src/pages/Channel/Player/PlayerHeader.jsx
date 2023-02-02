import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import { Menu } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import PlayerOverlay from './PlayerOverlay';
import UserAvatar from '../../../components/UserAvatar';
import useStateWithCallback from '../../../hooks/useStateWithCallback';
import FollowButton from '../../../components/FollowButton';

const PlayerHeader = ({
  avatarSrc,
  color,
  isProfileViewAnimationRunning,
  isProfileExpanded,
  isProfileViewAnimationEnabled,
  shouldShowPlayerOverlay,
  toggleProfileView,
  username
}) => {
  const { isSessionValid } = useUser();

  /**
   * We handle the layout animation duration separately in order to specifically
   * target the profile-view-specific layout changes. All other layout changes are
   * made instantly, with no animation.
   */
  const [layoutDuration, setLayoutDuration] = useStateWithCallback(0);
  const defaultAnimationDuration = DEFAULT_PROFILE_VIEW_TRANSITION.duration;

  const createProfileViewAnimation = useCallback(
    ({ expanded, collapsed }) =>
      createAnimationProps({
        customVariants: { visible: expanded, hidden: collapsed },
        options: {
          isVisible: isProfileExpanded,
          shouldAnimateIn: !isProfileExpanded
        },
        transition: {
          ...DEFAULT_PROFILE_VIEW_TRANSITION,
          layout: { duration: layoutDuration }
        }
      }),
    [isProfileExpanded, layoutDuration]
  );

  const handleProfileView = () =>
    setLayoutDuration(defaultAnimationDuration, toggleProfileView);

  useEffect(() => {
    if (!isProfileViewAnimationRunning) setLayoutDuration(0);
  }, [isProfileViewAnimationRunning, setLayoutDuration]);

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
        'z-10',
        'pointer-events-none',
        'items-center',
        isProfileExpanded
          ? ['justify-center', 'flex-col']
          : ['justify-between', 'flex-row']
      )}
    >
      <PlayerOverlay
        isGradientVisible={!isProfileExpanded}
        isVisible={shouldShowPlayerOverlay}
        position="top"
      >
        {!!username && (
          <div
            className={clsm(
              'flex',
              'items-center',
              'h-11',
              'w-full',
              isProfileExpanded ? 'justify-center' : 'justify-start'
            )}
          >
            <motion.h3
              layout="position"
              className={clsm([
                'absolute',
                'truncate',
                'text-black',
                'dark:text-white'
              ])}
              {...createProfileViewAnimation({
                expanded: { top: 200, maxWidth: '70%', padding: 0 },
                collapsed: {
                  top: 'auto',
                  maxWidth: '100%',
                  padding: '0 196px 0 64px'
                }
              })}
            >
              {username}
            </motion.h3>
          </div>
        )}
      </PlayerOverlay>
      <motion.div
        layout="position"
        className={clsm(['relative', 'shrink-0', 'pointer-events-all'])}
        {...createProfileViewAnimation({
          expanded: { top: 48 },
          collapsed: { top: 'auto' }
        })}
      >
        <button
          className={clsm([
            'group',
            'flex',
            'rounded-[50%]',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-white',
            'duration-[400ms]',
            'transition-all'
          ])}
          disabled={!isProfileViewAnimationEnabled}
          aria-label={`${isProfileExpanded ? 'Close' : 'Open'} profile view`}
          onClick={handleProfileView}
        >
          <UserAvatar
            className={clsm([
              'duration-[400ms]',
              'group-focus:ring-0',
              isProfileViewAnimationEnabled &&
                (isProfileExpanded
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
            size={isProfileExpanded ? 'xl' : 'lg'}
          />
        </button>
      </motion.div>
      <motion.div
        layout="position"
        className={clsm([
          'relative',
          'flex',
          'items-center',
          'pointer-events-all'
        ])}
        {...createProfileViewAnimation({
          expanded: { top: 108 },
          collapsed: { top: 'auto' }
        })}
      >
        <AnimatePresence>
          {shouldShowPlayerOverlay && (
            <motion.div
              {...createAnimationProps({
                animations: ['fadeIn-full']
              })}
            >
              <FollowButton isExpandedView={isProfileExpanded} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isSessionValid && (
            <motion.div
              {...createProfileViewAnimation({
                expanded: {
                  width: 'auto',
                  opacity: 1,
                  transition: {
                    ...DEFAULT_PROFILE_VIEW_TRANSITION,
                    delay: defaultAnimationDuration
                  }
                },
                collapsed: {
                  width: 0,
                  opacity: 0,
                  transition: {
                    ...DEFAULT_PROFILE_VIEW_TRANSITION,
                    default: { duration: defaultAnimationDuration },
                    opacity: { duration: defaultAnimationDuration / 4 }
                  }
                }
              })}
            >
              <Button className="ml-2" variant="icon">
                <Menu
                  className={clsm([
                    'w-6',
                    'h-6',
                    'dark:fill-white',
                    'fill-white-player'
                  ])}
                />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

PlayerHeader.defaultProps = {
  avatarSrc: '',
  color: 'default',
  isProfileViewAnimationRunning: false,
  isProfileExpanded: false,
  isProfileViewAnimationEnabled: true,
  shouldShowPlayerOverlay: true,
  username: ''
};

PlayerHeader.propTypes = {
  avatarSrc: PropTypes.string,
  color: PropTypes.string,
  isProfileViewAnimationRunning: PropTypes.bool,
  isProfileExpanded: PropTypes.bool,
  isProfileViewAnimationEnabled: PropTypes.bool,
  shouldShowPlayerOverlay: PropTypes.bool,
  toggleProfileView: PropTypes.func.isRequired,
  username: PropTypes.string
};

export default PlayerHeader;
