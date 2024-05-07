import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { PersonAdd } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import Button from '../../../../../components/Button/Button';
import Tooltip from '../../../../../components/Tooltip/Tooltip';

const $stageContent = $content.stream_manager_stage;

const InviteParticipant = ({ type, className = '', hideText = false }) => {
  const { isJoiningStageByRequestOrInvite } = useGlobalStage();
  const { isTouchscreenDevice, isDesktopView, isDefaultResponsiveView } =
    useResponsiveDevice();
  const isFullscreenType = type === 'fullscreen';

  const { handleCopyJoinParticipantLinkAndNotify, stageControlsVisibility } =
    useStreamManagerStage();
  const shouldRenderInviteParticipantText = isDesktopView
    ? isFullscreenType
    : !isDefaultResponsiveView;
  const { shouldRenderInviteLinkButton } = stageControlsVisibility;

  return (
    <div
      className={clsm([
        '@container/invite-participant-container',
        'dark:bg-darkMode-gray-medium',
        'bg-lightMode-gray-light',
        'flex',
        'justify-center',
        'items-center',
        isFullscreenType ? 'rounded-xl' : 'rounded',
        className
      ])}
    >
      {!isJoiningStageByRequestOrInvite && shouldRenderInviteLinkButton && (
        <div>
          <Tooltip
            key="stage-tooltip-participant-link"
            position="above"
            translate={{ y: 6 }}
            message={$stageContent.copy_session_link}
          >
            <div className={clsm(['flex', 'justify-center'])}>
              <Button
                ariaLabel={$stageContent.copy_session_link}
                key="invite-participant-stage-btn"
                variant="icon"
                onClick={handleCopyJoinParticipantLinkAndNotify}
                disableHover={isTouchscreenDevice}
                className={clsm([
                  '-mt-1',
                  'w-7',
                  'h-7',
                  '@[44px]/invite-participant-container:w-11',
                  '@[44px]/invite-participant-container:h-11',
                  'dark:[&>svg]:fill-white',
                  '[&>svg]:fill-black',
                  'dark:bg-darkMode-gray',
                  !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                  'dark:focus:bg-darkMode-gray',
                  'bg-lightMode-gray'
                ])}
              >
                <PersonAdd />
              </Button>
            </div>
          </Tooltip>
          {!hideText && (
            <motion.h4
              {...createAnimationProps({
                customVariants: {
                  hidden: {
                    opacity: 0,
                    transitionEnd: { display: 'none' }
                  },
                  visible: {
                    display: 'block',
                    opacity: 1,
                    transition: {
                      delay: 0.1
                    }
                  }
                },
                options: {
                  isVisible: shouldRenderInviteParticipantText
                }
              })}
              className={clsm([
                '!hidden',
                'font-bold',
                'mt-2',
                'cursor-default',
                '@md/video-container:!block'
              ])}
            >
              {$stageContent.invite_participant}
            </motion.h4>
          )}
        </div>
      )}
    </div>
  );
};

InviteParticipant.propTypes = {
  className: PropTypes.string,
  hideText: PropTypes.bool,
  type: PropTypes.oneOf(['golive', 'fullscreen']).isRequired
};

export default InviteParticipant;
