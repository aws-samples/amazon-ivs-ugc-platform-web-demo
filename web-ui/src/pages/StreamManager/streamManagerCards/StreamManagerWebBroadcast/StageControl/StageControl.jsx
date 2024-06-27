import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { useGlobalStage } from '../../../../../contexts/Stage';
import Spinner from '../../../../../components/Spinner';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { CreateStage, Menu } from '../../../../../assets/icons';
import StageMenu from './StageMenu';
import { BREAKPOINTS } from '../../../../../constants';
import Tooltip from '../../../../../components/Tooltip';
import Button from '../../../../../components/Button';
import StageControls from '../FullScreenView/StageControls';
import { useStageManager } from '../../../../../contexts/StageManager/StageManager';
import { useNavigate, useNavigation } from 'react-router-dom';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { useStreams } from '../../../../../contexts/Streams';

const $stageContent = $content.stream_manager_stage;
const {
  notifications: {
    error: { permissions_denied }
  }
} = $content.stream_manager_stage;

const StageControl = ({ goLiveContainerVideoContainerRef }) => {
  const stageMenuToggleBtnRef = useRef();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleToggleStageMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const { isTouchscreenDevice, isDesktopView, currentBreakpoint } =
    useResponsiveDevice();
  const navigate = useNavigate();

  const { user: userStage = null, participantRole } = useStageManager() || {};
  const isStageActive = userStage?.isUserStageConnected;
  const { isBroadcasting, hasPermissions } = useBroadcast();
  const { isLive } = useStreams();
  const isSpectator = participantRole === 'spectator';
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;
  const shouldDisableCollaborateButton = isLive || isBroadcasting;

  const {
    collaborateButtonAnimationControls,
    animateCollapseStageContainerWithDelay
  } = useGlobalStage();
  const isCollaborateDisabled =
    shouldDisableCollaborateButton ||
    !hasPermissions ||
    shouldDisableCopyLinkButton;

  let collaborateButtonContent;

  if (!hasPermissions) collaborateButtonContent = permissions_denied;
  else
    collaborateButtonContent = animateCollapseStageContainerWithDelay
      ? $stageContent.copy_session_link
      : $stageContent.collaborate;

  let icon;

  const { state: navigationState } = useNavigation();
  const isLoadingCollaborate = navigationState === 'loading';

  if (isLoadingCollaborate) {
    icon = <Spinner variant="light" />;
  } else {
    icon = animateCollapseStageContainerWithDelay ? (
      <AnimatePresence>
        <motion.div
          className={clsm([
            'dark:[&>svg]:fill-white',
            '[&>svg]:fill-black',
            '[&>svg]:w-6',
            '[&>svg]:h-6'
          ])}
          {...createAnimationProps({
            transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
            controls: { opacity: 1 }
          })}
        >
          <Menu
            className={clsm([
              'dark:fill-white',
              'fill-white-player',
              'h-6',
              'w-6'
            ])}
          />
          <StageMenu
            containerClasses={clsm(
              'absolute',
              'z-10',
              !isDesktopView || currentBreakpoint === BREAKPOINTS.xxs
                ? ['right-[87px]', 'bottom-[132px]']
                : ['bottom-[-66px]', 'right-[118px]']
            )}
            isOpen={isMenuOpen}
            parentEl={goLiveContainerVideoContainerRef.current}
            toggleBtnRef={stageMenuToggleBtnRef}
            toggleMenu={handleToggleStageMenu}
          />
        </motion.div>
      </AnimatePresence>
    ) : (
      <CreateStage />
    );
  }

  return (
    <motion.div className={clsm(['flex', 'items-center'])}>
      <Tooltip
        key="stage-control-tooltip-collaborate"
        position="above"
        translate={{ y: 6 }}
        message={
          !shouldDisableCollaborateButton &&
          !shouldDisableCopyLinkButton &&
          !isStageActive &&
          collaborateButtonContent
        }
      >
        <AnimatePresence>
          <motion.div
            animate={collaborateButtonAnimationControls}
            className={clsm([
              'border-l-[1px]',
              'border-darkMode-gray-medium',
              currentBreakpoint === BREAKPOINTS.xxs ? 'pl-[6px]' : 'pl-3',
              'mt-1'
            ])}
            {...createAnimationProps({
              transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
              controls: { opacity: 1 },
              options: {
                isVisible: isStageActive
              }
            })}
          >
            {!isStageActive ||
            isDesktopView ||
            currentBreakpoint === BREAKPOINTS.xxs ? (
              <Button
                ariaLabel={collaborateButtonContent}
                ref={stageMenuToggleBtnRef}
                key="create-stage-control-btn"
                variant="icon"
                onClick={
                  isStageActive
                    ? handleToggleStageMenu
                    : () => navigate('/manager/collab')
                }
                isDisabled={isCollaborateDisabled}
                disableHover={isTouchscreenDevice}
                className={clsm([
                  '-mt-1',
                  'w-11',
                  'h-11',
                  'dark:[&>svg]:fill-white',
                  '[&>svg]:fill-black',
                  'dark:bg-darkMode-gray',
                  !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                  'dark:focus:bg-darkMode-gray',
                  'bg-lightMode-gray'
                ])}
              >
                {icon}
              </Button>
            ) : (
              <motion.div
                {...createAnimationProps({
                  transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
                  controls: { opacity: 1 }
                })}
              >
                <StageControls shouldShowCopyLinkText={false} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </Tooltip>
    </motion.div>
  );
};

StageControl.propTypes = {
  goLiveContainerVideoContainerRef: PropTypes.object.isRequired
};

export default StageControl;
