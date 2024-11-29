import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useLayoutEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../utils';
import { CreateStage } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import BroadcastControlWrapper from '../BroadcastControl/BroadcastControlWrapper';
import Button from '../../../../../components/Button/Button';
import GoLiveStreamButton from '../GoLiveStreamButton';
import Spinner from '../../../../../components/Spinner';
import { StageControl } from '../StageControl';
import Tooltip from '../../../../../components/Tooltip/Tooltip';
import { useStageManager } from '../../../../../contexts/StageManager';
import { useStreams } from '../../../../../contexts/Streams';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { useNavigate, useNavigation } from 'react-router-dom';
import { updateFullscreenStates } from '../../../../../reducers/streamManager';
import { updateCollaborateStates } from '../../../../../reducers/shared';
import {
  COLLABORATE_ROUTE_PATH,
  FULLSCREEN_ANIMATION_TRANSITION,
  PARTICIPANT_TYPES
} from '../../../../../constants';
import { useChat } from '../../../../../contexts/Chat';

const $stageContent = $content.stream_manager_stage;

const Footer = ({ shouldAddScrollbar }) => {
  const dispatch = useDispatch();
  const {
    animationInitialPos: { goLiveButtonWidth, broadcastControllerMarginLeft },
    fullscreen: { isCollaborateButtonVisible, isOpen: isFullscreenOpen }
  } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const navigate = useNavigate();
  const { state: navigationState } = useNavigation();
  const { isTouchscreenDevice, isMobileView } = useResponsiveDevice();
  const { user: userStage = null } = useStageManager() || {};
  const { isLive } = useStreams();
  const { isBroadcasting, hasPermissions } = useBroadcast();
  const { saveTempChatMessages } = useChat();

  // Collaborate stage participants
  const isInvitedStageUser =
    collaborate.participantType === PARTICIPANT_TYPES.INVITED;
  const isRequestedStageUser =
    collaborate.participantType === PARTICIPANT_TYPES.REQUESTED;

  // Collaborate stage status
  const isStageActive = userStage?.isConnected;
  const isLoadingCollaborate = navigationState === 'loading';

  // UI
  const shouldAnimateGoLiveButton =
    !isInvitedStageUser && !isRequestedStageUser;
  const isCollaborateDisabled = isLive || isBroadcasting || !hasPermissions;

  const marginLeft = useMemo(() => {
    /**
     * The margin left calculation is based on
     * full screen width (100%) - (button width + margin)
     */
    let marginLeft = 'calc(50% - 90px)'; // 'GoLive' button 1/2 width (70px) + margin (20px)

    if (isStageActive || collaborate.isJoining) {
      if (isFullscreenOpen && isMobileView) {
        marginLeft = 'calc(100% - 74px)';
      } else {
        marginLeft = 'calc(100% - 110px)';
      }
    }

    return marginLeft;
  }, [collaborate.isJoining, isFullscreenOpen, isMobileView, isStageActive]);

  const startCollaborate = async () => {
    dispatch(
      updateCollaborateStates({ participantType: PARTICIPANT_TYPES.HOST })
    );
    // Temporarily save chat messages before navigating away
    await saveTempChatMessages();

    navigate(COLLABORATE_ROUTE_PATH);
  };

  useLayoutEffect(() => {
    // Show/hide the fullscreen collaborate button based on whether the user is connected to a collaborate session
    dispatch(
      updateFullscreenStates({
        isCollaborateButtonVisible: !isStageActive
      })
    );
  }, [dispatch, isStageActive]);

  return (
    <div
      className={clsm([
        'flex',
        'justify-between',
        collaborate.isJoining && 'opacity-0',
        shouldAddScrollbar && 'relative'
      ])}
    >
      <motion.div
        {...createAnimationProps({
          customVariants: {
            hidden: {
              marginRight: 0,
              marginLeft: broadcastControllerMarginLeft
            },
            visible: {
              marginRight: isMobileView ? 0 : 138, // 1/2 width + space between buttons
              marginLeft: 0
            }
          },
          transition: FULLSCREEN_ANIMATION_TRANSITION,
          options: {
            isVisible: isFullscreenOpen
          }
        })}
      >
        <BroadcastControlWrapper
          withSettingsButton
          withScreenshareButton
          isOpen
        />
      </motion.div>
      {isCollaborateButtonVisible && (
        <div className={clsm(['flex', 'flex-col', 'justify-center'])}>
          <Tooltip
            key="stage-control-tooltip-collaborate"
            position="above"
            translate={{ y: 2 }}
            message={
              !isCollaborateDisabled && hasPermissions
                ? $stageContent.collaborate
                : $stageContent.notifications.error.permissions_denied
            }
          >
            <Button
              ariaLabel={$stageContent.collaborate}
              key="create-stage-control-btn"
              variant="icon"
              onClick={startCollaborate}
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
              isDisabled={isCollaborateDisabled}
            >
              {isLoadingCollaborate ? (
                <Spinner variant="light" />
              ) : (
                <CreateStage />
              )}
            </Button>
          </Tooltip>
        </div>
      )}
      {isStageActive && <StageControl shouldShowCopyLinkText={!isMobileView} />}
      <motion.div
        className={clsm([
          'absolute',
          'bottom-5',
          isStageActive && shouldAddScrollbar && 'right-1',
          'w-full'
        ])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              width: goLiveButtonWidth,
              marginLeft: 0,
              opacity: 1
            },
            visible: {
              width: isStageActive || collaborate.isJoining ? 40 : 140,
              marginLeft: marginLeft
            }
          },
          options: {
            shouldAnimateIn: !isFullscreenOpen,
            isVisible: shouldAnimateGoLiveButton || isFullscreenOpen
          },
          transition: FULLSCREEN_ANIMATION_TRANSITION
        })}
      >
        <GoLiveStreamButton
          tooltipPosition="above"
          tooltipCustomTranslate={{ y: 2 }}
        />
      </motion.div>
    </div>
  );
};

Footer.propTypes = {
  shouldAddScrollbar: PropTypes.bool.isRequired
};

export default Footer;
