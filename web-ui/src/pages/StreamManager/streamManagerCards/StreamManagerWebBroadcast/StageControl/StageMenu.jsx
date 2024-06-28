import { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

import { clsm } from '../../../../../utils';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { PersonAdd, Group } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Button from '../../../../../components/Button';
import useClickAway from '../../../../../hooks/useClickAway';
import withPortal from '../../../../../components/withPortal';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import RequestIndicator from './RequestIndicator';

const $stageContent = $content.stream_manager_stage;
const BUTTON_TEXT_CLASSES = ['text-black', 'dark:text-white'];
const IconClasses = clsm([
  'dark:fill-white',
  'fill-white-player',
  'h-6',
  'w-6',
  'fill-black'
]);

const StageMenu = ({ isOpen, toggleMenu, toggleBtnRef }) => {
  const menuRef = useRef();
  const { openModal } = useModal();
  const { handleCopyJoinParticipantLinkAndNotify } = useStreamManagerStage();
  const { isHost, isStageActive, stageRequestList } = useGlobalStage();
  const { isMobileView } = useResponsiveDevice();
  const shouldDisplayParticipantsModalButton = isHost && isStageActive;
  const handleOpenParticipantsModal = () => {
    openModal({
      type: MODAL_TYPE.STAGE_PARTICIPANTS,
      lastFocusedElement: toggleBtnRef
    });
  };

  useClickAway([toggleBtnRef, menuRef], toggleMenu, isOpen);
  useFocusTrap([menuRef]);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        {...createAnimationProps({
          animations: ['fadeIn-full', 'scale'],
          options: { isVisible: isOpen },
          customVariants: {
            visible: {
              x: isMobileView ? '-50%' : 0,
              display: 'flex'
            },
            hidden: {
              x: isMobileView ? '-50%' : 0,
              transitionEnd: { display: 'none' }
            }
          }
        })}
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray',
          'absolute',
          'flex-col',
          'gap-4',
          'mt-2',
          'origin-top-left',
          isMobileView && 'origin-bottom-right',
          'p-4',
          'rounded-3xl',
          'w-auto'
        ])}
      >
        {shouldDisplayParticipantsModalButton && (
          <Button
            variant="tertiaryText"
            onClick={handleOpenParticipantsModal}
            className={clsm(BUTTON_TEXT_CLASSES, 'space-x-4')}
          >
            <div className="relative">
              <Group className={IconClasses} />
              {stageRequestList.length > 0 && (
                <RequestIndicator
                  stageRequestsCount={stageRequestList.length}
                  className={clsm(['left-[18px]', '-top-4'])}
                />
              )}
            </div>
            <p>{$stageContent.participants}</p>
          </Button>
        )}
        <Button
          variant="tertiaryText"
          onClick={handleCopyJoinParticipantLinkAndNotify}
          className={clsm(BUTTON_TEXT_CLASSES)}
        >
          <PersonAdd className={IconClasses} />
          <p>{$stageContent.copy_link}</p>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};

StageMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleMenu: PropTypes.func.isRequired,
  toggleBtnRef: PropTypes.object.isRequired
};

export default withPortal(StageMenu, 'stage-menu', {
  isAnimated: true
});
