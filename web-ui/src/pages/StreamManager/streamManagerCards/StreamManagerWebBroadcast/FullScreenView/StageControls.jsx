import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { AnimatePresence, motion } from 'framer-motion';
import { clsm } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { ANIMATION_DURATION } from '../../../../../contexts/BroadcastFullscreen';
import Tooltip from '../../../../../components/Tooltip';
import Button from '../../../../../components/Button';
import { PersonAdd, Group, Menu } from '../../../../../assets/icons';
import { CONTROLLER_BUTTON_THEME } from '../BroadcastControl/BroadcastControllerTheme';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { StageMenu } from '../StageControl';
import RequestIndicator from '../StageControl/RequestIndicator';

const $stageContent = $content.stream_manager_stage;

const StageControls = ({ shouldShowCopyLinkText }) => {
  const participantsButtonRef = useRef();
  const { openModal } = useModal();
  const { isTouchscreenDevice, dimensions } = useResponsiveDevice();
  const {
    handleCopyJoinParticipantLinkAndNotify,
    shouldDisableCopyLinkButton,
    stageControlsVisibility
  } = useStreamManagerStage();
  const { isStageActive, isHost, stageRequestList } = useGlobalStage();
  const { shouldRenderInviteLinkButton } = stageControlsVisibility;

  const handleOpenParticipantsModal = () => {
    openModal({
      type: MODAL_TYPE.STAGE_PARTICIPANTS,
      lastFocusedElement: participantsButtonRef
    });
  };

  const shouldDisplayInviteParticipantButton = isStageActive && isHost;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleStageMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const containerRef = useRef();

  const getMarginRight = () => {
    return dimensions?.width < 375 ? 'mr-[48px]' : 'mr-[60px]';
  };

  const stageMenuToggleBtnRef = useRef();

  return (
    <div
      ref={containerRef}
      className={clsm(['flex', 'items-center', getMarginRight()])}
    >
      <motion.div
        key="stage-full-screen-footer"
        className={clsm([
          'flex',
          'items-center',
          isHost && dimensions?.width < 375 ? 'space-x-1' : 'space-x-4'
        ])}
        {...(shouldShowCopyLinkText &&
          createAnimationProps({
            animations: ['fadeIn-full'],
            customVariants: {
              visible: {
                transition: {
                  opacity: { delay: ANIMATION_DURATION }
                }
              }
            },
            options: {
              isVisible: isStageActive
            }
          }))}
      >
        {isHost && dimensions?.width < 375 ? (
          <Button
            ariaLabel="Toggle menu"
            ref={stageMenuToggleBtnRef}
            key="toggle-menu-btn"
            variant="icon"
            onClick={handleToggleStageMenu}
            disableHover={isTouchscreenDevice}
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
          >
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
                    'right-[110px]',
                    'bottom-[220px]'
                  )}
                  isOpen={isMenuOpen}
                  parentEl={containerRef.current}
                  toggleBtnRef={stageMenuToggleBtnRef}
                  toggleMenu={handleToggleStageMenu}
                />
              </motion.div>
            </AnimatePresence>
          </Button>
        ) : (
          <>
            {shouldDisplayInviteParticipantButton && (
              <Tooltip
                key="stage-control-tooltip-collaborate"
                position="above"
                translate={{ y: 2 }}
                message={$stageContent.participants}
              >
                <Button
                  ariaLabel={$stageContent.participants}
                  key="stage-participants-control-btn"
                  variant="icon"
                  ref={participantsButtonRef}
                  onClick={handleOpenParticipantsModal}
                  className={clsm([
                    'relative',
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
                  <Group />
                  {stageRequestList.length > 0 && (
                    <RequestIndicator
                      stageRequestsCount={stageRequestList.length}
                      className={clsm(['left-7', '-top-1'])}
                    />
                  )}
                </Button>
              </Tooltip>
            )}
            {shouldRenderInviteLinkButton && (
              <Tooltip
                key="stage-control-tooltip-copy-link"
                position="above"
                translate={{ y: 2 }}
                message={
                  !shouldDisableCopyLinkButton &&
                  $stageContent.copy_session_link
                }
              >
                <Button
                  className={clsm([
                    shouldShowCopyLinkText
                      ? ['px-4', 'space-x-1']
                      : 'px-[10px]',
                    'w-full',
                    CONTROLLER_BUTTON_THEME,
                    !shouldShowCopyLinkText && ['min-w-0']
                  ])}
                  onClick={handleCopyJoinParticipantLinkAndNotify}
                  variant="secondary"
                  isDisabled={shouldDisableCopyLinkButton}
                >
                  <PersonAdd
                    className={clsm([
                      'w-6',
                      'h-6',
                      !shouldShowCopyLinkText && ['mr-0', 'p-0']
                    ])}
                  />
                  <p>{shouldShowCopyLinkText && $stageContent.copy_link}</p>
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

StageControls.defaultProps = {
  shouldShowCopyLinkText: true
};

StageControls.propTypes = {
  shouldShowCopyLinkText: PropTypes.bool
};

export default StageControls;
