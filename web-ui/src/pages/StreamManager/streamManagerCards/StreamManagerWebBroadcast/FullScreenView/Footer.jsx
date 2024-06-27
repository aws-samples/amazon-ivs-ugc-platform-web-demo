import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../utils';
import {
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { CreateStage } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import BroadcastControlWrapper from '../BroadcastControl/BroadcastControlWrapper';
import Button from '../../../../../components/Button/Button';
import GoLiveStreamButton from '../GoLiveStreamButton';
import Spinner from '../../../../../components/Spinner';
import StageControls from './StageControls';
import Tooltip from '../../../../../components/Tooltip/Tooltip';
import { useStageManager } from '../../../../../contexts/StageManager';
import { useStreams } from '../../../../../contexts/Streams';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { useNavigate, useNavigation } from 'react-router-dom';

const $stageContent = $content.stream_manager_stage;

const Footer = ({ shouldAddScrollbar }) => {
  const navigate = useNavigate();
  const { state: navigationState } = useNavigation();
  const isLoadingCollaborate = navigationState === 'loading';
  const {
    user: userStage = null,
    participantRole,
    isJoiningStageByRequestOrInvite
  } = useStageManager() || {};
  const isInvitedStageUser = participantRole === 'invited';
  const isRequestedStageUser = participantRole === 'requested';
  const shouldAnimateGoLiveButton =
    !isInvitedStageUser && !isRequestedStageUser;
  const isStageActive = userStage?.isUserStageConnected;
  const {
    shouldRenderFullScreenCollaborateButton,
    isFullScreenViewOpen,
    dimensions
  } = useBroadcastFullScreen();
  const { goLiveButtonInitialWidth, broadcastControllerInitialMarginLeft } =
    dimensions;
  const { isTouchscreenDevice, isMobileView } = useResponsiveDevice();
  const { isLive } = useStreams();
  const { isBroadcasting, hasPermissions } = useBroadcast();
  const shouldDisableCollaborateButton = isLive || isBroadcasting;

  const getMarginLeft = () => {
    if (isStageActive || isJoiningStageByRequestOrInvite) {
      if (isFullScreenViewOpen) {
        return isMobileView ? 'calc(100% - 74px)' : 'calc(100% - 110px)';
      }
      return 'calc(100% - 110px)';
    }

    return 'calc(50% - 90px)'; // Calculate centering for the 'Go Live' button: 70px equals half button width + 20px left margin.
  };

  const isCollaborateDisabled =
    shouldDisableCollaborateButton || !hasPermissions;

  return (
    <div
      className={clsm([
        'flex',
        'justify-between',
        isJoiningStageByRequestOrInvite && 'opacity-0',
        shouldAddScrollbar && 'relative'
      ])}
    >
      <motion.div
        {...createAnimationProps({
          customVariants: {
            hidden: {
              marginRight: 0,
              marginLeft: broadcastControllerInitialMarginLeft
            },
            visible: {
              marginRight: isMobileView ? 0 : 138, // 1/2 width + space between buttons
              marginLeft: 0
            }
          },
          transition: ANIMATION_TRANSITION
        })}
      >
        <BroadcastControlWrapper
          withSettingsButton
          withScreenshareButton
          isOpen
        />
      </motion.div>
      {shouldRenderFullScreenCollaborateButton && !isStageActive && (
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
              onClick={() => navigate('/manager/collab')}
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
      {isStageActive && (
        <StageControls shouldShowCopyLinkText={!isMobileView} />
      )}
      <motion.div
        className={clsm([
          'absolute',
          'bottom-5',
          isStageActive && shouldAddScrollbar && 'right-1',
          'w-full'
        ])}
        style={
          !shouldAnimateGoLiveButton
            ? {
                width:
                  isStageActive || isJoiningStageByRequestOrInvite ? 40 : 140,
                marginLeft: getMarginLeft()
              }
            : {}
        }
        {...(shouldAnimateGoLiveButton
          ? createAnimationProps({
              customVariants: {
                hidden: {
                  width: goLiveButtonInitialWidth,
                  marginLeft: 0,
                  opacity: 1
                },
                visible: {
                  width:
                    isStageActive || isJoiningStageByRequestOrInvite ? 40 : 140,
                  marginLeft: getMarginLeft()
                }
              },
              options: {
                shouldAnimatedIn: !isJoiningStageByRequestOrInvite
              },
              transition: ANIMATION_TRANSITION
            })
          : {})}
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
