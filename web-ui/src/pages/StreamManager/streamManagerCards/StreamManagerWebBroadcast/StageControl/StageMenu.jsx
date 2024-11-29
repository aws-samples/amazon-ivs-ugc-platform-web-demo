import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { PersonAdd, Group } from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Button from '../../../../../components/Button';
import useClickAway from '../../../../../hooks/useClickAway';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import RequestIndicator from './RequestIndicator';
import { useStageManager } from '../../../../../contexts/StageManager';
import { PARTICIPANT_TYPES } from '../../../../../constants';
import useResize from '../../../../../hooks/useResize';

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
  const { collaborate } = useSelector((state) => state.shared);
  const menuRef = useRef();
  const { openModal } = useModal();
  const { user: userStage = null, stageControls = null } =
    useStageManager() || {};
  const { isMobileView } = useResponsiveDevice();

  const isStageActive = userStage?.isConnected;
  const { copyInviteUrl } = stageControls || {};
  const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;
  const shouldDisplayParticipantsModalButton = isHost && isStageActive;

  const handleOpenParticipantsModal = () => {
    openModal({
      type: MODAL_TYPE.STAGE_PARTICIPANTS,
      lastFocusedElement: toggleBtnRef
    });
  };

  const closeMenu = useCallback(() => {
    toggleMenu(false);
  }, [toggleMenu]);

  useClickAway([toggleBtnRef, menuRef], toggleMenu, isOpen);
  useFocusTrap([menuRef]);
  useResize(closeMenu);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          {...createAnimationProps({
            animations: ['fadeIn-full', 'scale'],
            customVariants: {
              visible: {
                x: isMobileView ? '-75%' : 0,
                display: 'flex'
              },
              hidden: {
                transitionEnd: { display: 'none' }
              }
            }
          })}
          className={clsm([
            'z-20',
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray',
            'absolute',
            'flex-col',
            'gap-4',
            'mt-2',
            'origin-top-left',
            'p-4',
            'rounded-3xl',
            'w-auto',
            isMobileView && ['origin-top-right', 'top-full']
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
                {collaborate.requestList.length > 0 && (
                  <RequestIndicator
                    stageRequestsCount={collaborate.requestList.length}
                    className={clsm(['left-[18px]', '-top-4'])}
                  />
                )}
              </div>
              <p>{$stageContent.participants}</p>
            </Button>
          )}
          <Button
            variant="tertiaryText"
            onClick={copyInviteUrl}
            className={clsm(BUTTON_TEXT_CLASSES)}
          >
            <PersonAdd className={IconClasses} />
            <p>{$stageContent.copy_link}</p>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

StageMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleMenu: PropTypes.func.isRequired,
  toggleBtnRef: PropTypes.object.isRequired
};

export default StageMenu;
