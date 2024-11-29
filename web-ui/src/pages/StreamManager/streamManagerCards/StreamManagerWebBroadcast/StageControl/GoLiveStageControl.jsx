import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo, useRef, useState } from 'react';

import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Spinner from '../../../../../components/Spinner';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { CreateStage, Menu } from '../../../../../assets/icons';
import StageMenu from './StageMenu';
import {
  BREAKPOINTS,
  COLLABORATE_ROUTE_PATH,
  PARTICIPANT_TYPES
} from '../../../../../constants';
import Tooltip from '../../../../../components/Tooltip';
import Button from '../../../../../components/Button';
import StageControl from './StageControl';
import { useStageManager } from '../../../../../contexts/StageManager/StageManager';
import { useNavigate, useNavigation } from 'react-router-dom';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { useStreams } from '../../../../../contexts/Streams';
import { updateCollaborateStates } from '../../../../../reducers/shared';
import { useChat } from '../../../../../contexts/Chat';

const $stageContent = $content.stream_manager_stage;
const {
  notifications: {
    error: { permissions_denied }
  }
} = $content.stream_manager_stage;

const GoLiveStageControl = () => {
  const dispatch = useDispatch();
  const { goLiveContainer } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const stageMenuToggleBtnRef = useRef();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isTouchscreenDevice, isDesktopView, currentBreakpoint } =
    useResponsiveDevice();
  const navigate = useNavigate();
  const collaborateButtonAnimationControls = useAnimationControls();
  const { saveTempChatMessages } = useChat();

  const { user: userStage = null } = useStageManager() || {};
  const isStageActive = userStage?.isConnected;
  const { isBroadcasting, hasPermissions } = useBroadcast();
  const { isLive } = useStreams();
  const isSpectator =
    collaborate.participantType === PARTICIPANT_TYPES.SPECTATOR;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;
  const shouldDisableCollaborateButton = isLive || isBroadcasting;
  const isCollaborateDisabled =
    shouldDisableCollaborateButton ||
    !hasPermissions ||
    shouldDisableCopyLinkButton;

  const { state: navigationState } = useNavigation();
  const isLoadingCollaborate = navigationState === 'loading';

  const startCollaborate = async () => {
    dispatch(
      updateCollaborateStates({ participantType: PARTICIPANT_TYPES.HOST })
    );
    // Temporarily save chat messages before navigating away
    await saveTempChatMessages();

    navigate(COLLABORATE_ROUTE_PATH);
  };

  const handleToggleStageMenu = useCallback(
    (isOpen = null) => {
      if (typeof isOpen === 'boolean') {
        setIsMenuOpen(isOpen);
      } else {
        setIsMenuOpen(!isMenuOpen);
      }
    },
    [isMenuOpen]
  );

  let collaborateButtonContent;

  if (!hasPermissions) collaborateButtonContent = permissions_denied;
  else
    collaborateButtonContent = goLiveContainer.delayAnimation
      ? $stageContent.copy_session_link
      : $stageContent.collaborate;

  const startCollabAndStageMenuIcon = useMemo(() => {
    let icon;

    if (isLoadingCollaborate) {
      icon = <Spinner variant="light" />;
    } else {
      icon = isStageActive ? (
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
          </motion.div>
        </AnimatePresence>
      ) : (
        <CreateStage />
      );
    }

    return icon;
  }, [isLoadingCollaborate, isStageActive]);

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
                  isStageActive ? handleToggleStageMenu : startCollaborate
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
                {startCollabAndStageMenuIcon}
              </Button>
            ) : (
              <motion.div
                {...createAnimationProps({
                  transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
                  controls: { opacity: 1 }
                })}
              >
                <StageControl shouldShowCopyLinkText={false} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
        <StageMenu
          isOpen={isMenuOpen}
          toggleBtnRef={stageMenuToggleBtnRef}
          toggleMenu={handleToggleStageMenu}
        />
      </Tooltip>
    </motion.div>
  );
};

export default GoLiveStageControl;
