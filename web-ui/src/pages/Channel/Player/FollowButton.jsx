import PropTypes from 'prop-types';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import Tooltip from '../../../components/Tooltip';
import useThrottledCallback from '../../../hooks/useThrottledCallback';
import { channel as $channelContent } from '../../../content';
import { channelAPI } from '../../../api';
import { clsm, isTextColorInverted } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { Favorite, Unfollow } from '../../../assets/icons';
import { useChannel } from '../../../contexts/Channel';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import { usePlayerContext } from '../contexts/Player';

const $content = $channelContent.follow_button;

const customSpringTransition = {
  type: 'spring',
  damping: 20,
  stiffness: 300
};

const textAnimationProps = createAnimationProps({
  animations: ['fadeIn-full', 'slideIn-right'],
  transition: customSpringTransition
});

const FollowButton = ({ isExpandedView }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifyError } = useNotif();
  const { userData, isSessionValid } = useUser();
  const { channelData, refreshChannelData } = useChannel();
  const {
    color: channelColor,
    isViewerFollowing,
    username: channelUsername
  } = channelData || {};
  const { username: ownUsername } = userData || {};
  const { isMobileView, isTouchscreenDevice } = useResponsiveDevice();
  const { stopPropagAndResetTimeout, subscribeOverlayElement } =
    usePlayerContext();
  const [isFollowing, setIsFollowing] = useState(isViewerFollowing);
  const [disableHover, setDisableHover] = useState(false);
  const [shouldShowSpinner, setShouldShowSpinner] = useState(false);
  const buttonRef = useRef();
  const spinnerTimeoutId = useRef();
  const isLoading = useRef(false);
  const shouldInvertColors = isTextColorInverted(channelColor);
  const isFullWidthButton = !isMobileView || isExpandedView;
  const locationStoredUsername = location.state?.locationStoredUsername;
  const isOwnChannel = ownUsername === channelUsername;

  let toolTipMessage = '';
  if (isViewerFollowing && !isTouchscreenDevice) {
    toolTipMessage = disableHover
      ? $content.tooltip.following
      : $content.tooltip.unfollow;
  }

  const iconClassNames = [
    'w-6',
    'h-6',
    isFullWidthButton && ['absolute', 'left-4', isFollowing && 'left-2.5']
  ];

  const buttonAnimationProps = createAnimationProps({
    customVariants: {
      visible: {
        width: 44
      },
      hidden: { width: 112 }
    },
    transition: customSpringTransition,
    options: {
      isVisible: !isFullWidthButton || isFollowing
    }
  });

  const subscribeOverlayControl = useCallback(
    (element) => {
      subscribeOverlayElement(element);
      buttonRef.current = element;
    },
    [subscribeOverlayElement]
  );

  const updateFollowingList = useCallback(async () => {
    isLoading.current = true;
    spinnerTimeoutId.current = setTimeout(
      () => isLoading.current && setShouldShowSpinner(true),
      200
    );

    const { result, error } = isFollowing
      ? await channelAPI.unfollowChannel(channelUsername)
      : await channelAPI.followChannel(channelUsername);

    if (result) {
      setIsFollowing(!isFollowing);
      refreshChannelData();
    }
    if (error)
      notifyError(
        isFollowing
          ? $content.notifications.error.unfollow_user
          : $content.notifications.error.follow_user
      );

    // Clear spinner timeout
    if (spinnerTimeoutId.current) clearTimeout(spinnerTimeoutId.current);
    isLoading.current = false;
    setShouldShowSpinner(false);
  }, [isFollowing, refreshChannelData, channelUsername, notifyError]);

  useEffect(() => {
    setIsFollowing(isViewerFollowing);
  }, [isViewerFollowing]);

  useEffect(() => {
    if (
      location.state &&
      locationStoredUsername === channelUsername &&
      !isFollowing
    ) {
      if (!isOwnChannel) updateFollowingList();

      // Clear react router state
      navigate(location.pathname, { replace: true });
    }
  }, [
    channelUsername,
    isFollowing,
    location,
    locationStoredUsername,
    navigate,
    updateFollowingList,
    isOwnChannel
  ]);

  const navigateToLogin = useCallback(
    () =>
      navigate('/login', {
        state: { from: location, locationStoredUsername: channelUsername }
      }),
    [location, navigate, channelUsername]
  );

  const handleButtonClick = useThrottledCallback((event) => {
    stopPropagAndResetTimeout(event);

    if (isSessionValid) {
      if (isLoading.current) return;
      updateFollowingList();

      // When user clicks button and stays hovering, disable hover styles
      if (!isTouchscreenDevice) setDisableHover(!isFollowing);
      buttonRef.current.blur();
    } else {
      navigateToLogin();
    }
  }, 200);

  // Hide button on authorized user's channel and before isFollowing state is set by isViewerBanned channel data
  if (isFollowing === undefined || ownUsername === channelUsername) return null;

  return (
    <AnimatePresence initial={false}>
      <Tooltip translate={{ y: -2 }} message={toolTipMessage}>
        <div
          className="overflow-x-hidden"
          onMouseLeave={() => setDisableHover(false)}
        >
          <Button
            animationProps={buttonAnimationProps}
            ariaLabel={
              isFollowing ? $content.unfollow_channel : $content.follow_channel
            }
            className={clsm(
              [
                'gap-x-2.5',
                'group',
                'min-w-0',
                'p-2.5',
                'relative',
                `bg-profile-${channelColor}`,
                `focus:bg-profile-${channelColor}`,
                !isExpandedView && 'md:!w-11', // Makes sure the width isn't set by the animation
                isTouchscreenDevice && `hover:bg-profile-${channelColor}`,
                !isTouchscreenDevice && !disableHover
                  ? `hover:bg-profile-${channelColor}-hover`
                  : 'hover:bg-none'
              ],
              !isFollowing && shouldInvertColors && 'text-white',
              isFollowing && [
                'bg-lightMode-gray',
                'dark:bg-darkMode-gray-light',
                isTouchscreenDevice && [
                  'dark:bg-darkMode-gray-light',
                  'hover:bg-lightMode-gray'
                ],
                !isTouchscreenDevice && [
                  'focus:bg-lightMode-red',
                  'focus:dark:bg-darkMode-red'
                ],
                !isTouchscreenDevice &&
                  !disableHover && [
                    'hover:bg-lightMode-red-hover',
                    'hover:dark:bg-darkMode-red-hover'
                  ]
              ]
            )}
            ref={subscribeOverlayControl}
            onClick={handleButtonClick}
            disableHover={disableHover}
          >
            {shouldShowSpinner ? (
              <Spinner />
            ) : (
              <>
                <Favorite
                  className={clsm(
                    iconClassNames,
                    '!fill-black',
                    !isFollowing && shouldInvertColors && '!fill-white',
                    isFollowing && [
                      'group-focus:hidden',
                      isTouchscreenDevice && 'hidden',
                      disableHover
                        ? 'group-hover:block'
                        : ['group-hover:hidden', 'group-hover:dark:fill-white']
                    ]
                  )}
                />
                <Unfollow
                  className={clsm(
                    iconClassNames,
                    'fill-white',
                    isFollowing && [
                      'group-focus:block',
                      isTouchscreenDevice && [
                        '!fill-black',
                        'group-hover:dark:fill-black'
                      ],
                      !isTouchscreenDevice && [
                        'group-hover:dark:fill-white',
                        'hidden',
                        disableHover
                          ? 'group-hover:hidden'
                          : ['group-hover:block', 'group-hover:fill-white']
                      ]
                    ],
                    !isFollowing && [
                      'hidden',
                      shouldInvertColors && 'dark:fill-white'
                    ]
                  )}
                />
                {isFullWidthButton && !isFollowing && (
                  <motion.span
                    {...textAnimationProps}
                    className={clsm(['absolute', 'right-4'])}
                  >
                    {$content.follow}
                  </motion.span>
                )}
              </>
            )}
          </Button>
        </div>
      </Tooltip>
    </AnimatePresence>
  );
};

FollowButton.defaultProps = {
  isExpandedView: false
};

FollowButton.propTypes = {
  isExpandedView: PropTypes.bool
};

export default FollowButton;
