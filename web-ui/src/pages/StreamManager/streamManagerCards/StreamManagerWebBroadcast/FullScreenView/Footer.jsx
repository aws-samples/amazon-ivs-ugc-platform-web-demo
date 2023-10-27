import { motion } from 'framer-motion';

import { useStreamManagerStage } from '../../../../../contexts/Stage';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';
import BroadcastControlWrapper from '../BroadcastControl/BroadcastControlWrapper';
import {
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import GoLiveStreamButton from '../GoLiveStreamButton';
import Tooltip from '../../../../../components/Tooltip/Tooltip';
import Button from '../../../../../components/Button/Button';
import Spinner from '../../../../../components/Spinner';
import { CreateStage } from '../../../../../assets/icons';
import { useGlobalStage } from '../../../../../contexts/Stage';
import StageControls from './StageControls';

const $stageContent = $content.stream_manager_stage;

const Footer = () => {
  const {
    initializeStageClient,
    isStageActive,
    shouldDisableCollaborateButton,
    hasPermissions
  } = useStreamManagerStage();
  const { collaborateButtonAnimationControls, isCreatingStage } =
    useGlobalStage();
  const {
    shouldRenderFullScreenCollaborateButton,
    setShouldRenderFullScreenCollaborateButton
  } = useBroadcastFullScreen();
  const { isTouchscreenDevice } = useResponsiveDevice();

  const handleCreateStage = async () => {
    await initializeStageClient();
    setShouldRenderFullScreenCollaborateButton(false);
    collaborateButtonAnimationControls.start({
      zIndex: 0,
      opacity: 0
    });
  };

  const isCollaborateDisabled =
    shouldDisableCollaborateButton || !hasPermissions;

  return (
    <div className={clsm(['flex', 'justify-between'])}>
      <motion.div
        {...createAnimationProps({
          customVariants: {
            hidden: {
              marginRight: 0
            },
            visible: {
              marginRight: 138 // 1/2 width + space between buttons
            }
          },
          transition: ANIMATION_TRANSITION
        })}
      >
        <BroadcastControlWrapper withSettingsButton isOpen />
      </motion.div>

      <motion.div
        className={clsm(['absolute', 'bottom-5', 'w-full'])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              width: 311,
              marginLeft: 0,
              opacity: 1
            },
            visible: {
              width: isStageActive ? 40 : 140,
              marginLeft: isStageActive
                ? 'calc(100% - 110px)'
                : 'calc(50% - 90px)' // Calculate centering for the 'Go Live' button: 70px equals half button width + 20px left margin.
            }
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
      {isStageActive && <StageControls />}
    </div>
  );
};

export default Footer;
