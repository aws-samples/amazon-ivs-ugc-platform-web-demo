import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { motion } from 'framer-motion';
import { clsm, noop } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { ANIMATION_DURATION } from '../../../../../contexts/BroadcastFullscreen';
import Tooltip from '../../../../../components/Tooltip';
import Button from '../../../../../components/Button';
import { PersonAdd, Group } from '../../../../../assets/icons';
import { CONTROLLER_BUTTON_THEME } from '../BroadcastControl/BroadcastControllerTheme';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';

const $stageContent = $content.stream_manager_stage;

const StageControls = ({ shouldShowCopyLinkText }) => {
  const participantsButtonRef = useRef();
  const { isTouchscreenDevice } = useResponsiveDevice();
  const {
    handleCopyJoinParticipantLinkAndNotify,
    shouldDisableCopyLinkButton
  } = useStreamManagerStage();
  const { isStageActive, isHost } = useGlobalStage();

  const shouldDisplayInviteParticipantButton = isStageActive && isHost;

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        shouldShowCopyLinkText && 'mr-[60px]'
      ])}
    >
      <motion.div
        key="stage-full-screen-footer"
        className={clsm(['flex', 'items-center', 'space-x-4'])}
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
              onClick={noop}
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
              <Group />
            </Button>
          </Tooltip>
        )}
        <Tooltip
          key="stage-control-tooltip-copy-link"
          position="above"
          translate={{ y: 2 }}
          message={
            !shouldDisableCopyLinkButton && $stageContent.copy_session_link
          }
        >
          <Button
            className={clsm([
              shouldShowCopyLinkText ? ['px-4', 'space-x-1'] : 'px-[10px]',
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
