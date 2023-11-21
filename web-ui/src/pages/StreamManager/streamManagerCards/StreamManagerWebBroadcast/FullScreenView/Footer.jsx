import { motion } from 'framer-motion';

import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../utils';
import {
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { CreateStage } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { useStreamManagerStage } from '../../../../../contexts/Stage';
import BroadcastControlWrapper from '../BroadcastControl/BroadcastControlWrapper';
import Button from '../../../../../components/Button/Button';
import GoLiveStreamButton from '../GoLiveStreamButton';
import Spinner from '../../../../../components/Spinner';
import StageControls from './StageControls';
import Tooltip from '../../../../../components/Tooltip/Tooltip';

const $stageContent = $content.stream_manager_stage;

const Footer = () => {
  const {
    initializeStageClient,
    isStageActive,
    shouldDisableCollaborateButton,
    hasPermissions
  } = useStreamManagerStage();
  const {
    collaborateButtonAnimationControls,
    isCreatingStage,
    isJoiningStageByRequestOrInvite
  } = useGlobalStage();
  const {
    shouldRenderFullScreenCollaborateButton,
    setShouldRenderFullScreenCollaborateButton,
    isFullScreenViewOpen,
    dimensions
  } = useBroadcastFullScreen();
  const { goLiveButtonInitialWidth, broadcastControllerInitialMarginLeft } =
    dimensions;

  const { isTouchscreenDevice, isMobileView } = useResponsiveDevice();

  const handleCreateStage = async () => {
    await initializeStageClient();
    setShouldRenderFullScreenCollaborateButton(false);
    collaborateButtonAnimationControls.start({
      zIndex: 0,
      opacity: 0
    });
  };

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
        isJoiningStageByRequestOrInvite && 'opacity-0'
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

      <motion.div
        className={clsm(['absolute', 'bottom-5', 'w-full'])}
        {...createAnimationProps({
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
        })}
      >
        <GoLiveStreamButton
          tooltipPosition="above"
          tooltipCustomTranslate={{ y: 2 }}
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
              onClick={handleCreateStage}
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
              {isCreatingStage ? <Spinner variant="light" /> : <CreateStage />}
            </Button>
          </Tooltip>
        </div>
      )}
      {isStageActive && (
        <StageControls shouldShowCopyLinkText={!isMobileView} />
      )}
    </div>
  );
};

export default Footer;
