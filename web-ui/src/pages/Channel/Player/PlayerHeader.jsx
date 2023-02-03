import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import { Menu } from '../../../assets/icons';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import FollowButton from '../../../components/FollowButton';
import PlayerOverlay from './PlayerOverlay';
import UserAvatar from '../../../components/UserAvatar';

const HEADER_BUTTON_CLASSES = clsm([
  'relative',
  'flex',
  'items-center',
  'shrink-0',
  'pointer-events-all',
  'z-10'
]);

const PlayerHeader = ({
  avatarSrc,
  color,
  shouldShowPlayerOverlay,
  username
}) => {
  const {
    getProfileViewAnimationProps,
    headerAnimationControls,
    isProfileViewAnimationEnabled,
    isProfileViewExpanded,
    shouldAnimateProfileView,
    toggleProfileView
  } = useProfileViewAnimation();
  const { isSessionValid } = useUser();
  const { isMobileView } = useResponsiveDevice();
  const layoutDependency = useRef(null);
  const animationDuration = DEFAULT_PROFILE_VIEW_TRANSITION.duration;

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
      <PlayerOverlay
        isGradientVisible={!isProfileViewExpanded}
        isVisible={shouldShowPlayerOverlay}
        position="top"
      >
        <div
          className={clsm(
            'flex',
            'items-center',
            'h-11',
            'w-full',
            isProfileViewExpanded ? 'justify-center' : 'justify-start'
          )}
        >
          <motion.h3
            layout="position"
            layoutDependency={layoutDependency.current}
            className={clsm([
              'absolute',
              'truncate',
              'text-black',
              'dark:text-white'
            ])}
            {...getPlayerHeaderProfileViewAnimationProps({
              expanded: {
                top: 200,
                maxWidth: isMobileView ? '80%' : '70%',
                padding: 0
              },
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
      </PlayerOverlay>
      <motion.div
        layout="position"
        layoutDependency={layoutDependency.current}
        className={HEADER_BUTTON_CLASSES}
        {...getPlayerHeaderProfileViewAnimationProps({
          expanded: { top: 64, desktop: { top: 48 } },
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
            'focus:ring-white'
          ])}
          disabled={!isProfileViewAnimationEnabled.current}
          aria-label={`${
            isProfileViewExpanded ? 'Close' : 'Open'
          } profile view`}
          onClick={() => toggleProfileView()}
        >
          <UserAvatar
            className={clsm([
              'duration-[400ms]',
              'group-focus:ring-0',
              isProfileViewAnimationEnabled.current &&
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
      <motion.div
        layout="position"
        layoutDependency={layoutDependency.current}
        className={HEADER_BUTTON_CLASSES}
        {...getPlayerHeaderProfileViewAnimationProps({
          expanded: { top: 124, desktop: { top: 108 } },
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
              <FollowButton isExpandedView={isProfileViewExpanded} />
            </motion.div>
          )}
        </AnimatePresence>
        {isSessionValid && (
          <motion.div
            {...getPlayerHeaderProfileViewAnimationProps({
              expanded: {
                width: 'auto',
                opacity: 1,
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
      </motion.div>
    </div>
  );
};

PlayerHeader.defaultProps = {
  avatarSrc: '',
  color: 'default',
  shouldShowPlayerOverlay: true,
  username: ''
};

PlayerHeader.propTypes = {
  avatarSrc: PropTypes.string,
  color: PropTypes.string,
  shouldShowPlayerOverlay: PropTypes.bool,
  username: PropTypes.string
};

export default PlayerHeader;
