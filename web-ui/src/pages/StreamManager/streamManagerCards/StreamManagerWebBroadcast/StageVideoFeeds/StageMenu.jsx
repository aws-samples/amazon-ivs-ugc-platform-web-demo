import { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

import { streamManager as $content } from '../../../../../content';
import { PersonAdd, Group } from '../../../../../assets/icons';
import { clsm, noop } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import Button from '../../../../../components/Button';
import useClickAway from '../../../../../hooks/useClickAway';
import withPortal from '../../../../../components/withPortal';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import { BREAKPOINTS } from '../../../../../constants';

const $stageContent = $content.stream_manager_stage;
const BUTTON_TEXT_CLASSES = ['text-black', 'dark:text-white'];
const IconClasses = clsm([
  'dark:fill-white',
  'fill-white-player',
  'h-6',
  'w-6'
]);

const StageMenu = ({ isOpen, toggleMenu, toggleBtnRef }) => {
  const menuRef = useRef();
  const { handleCopyJoinParticipantLinkAndNotify } = useStreamManagerStage();
  const { isHost, isStageActive } = useGlobalStage();
  const { isMobileView, currentBreakpoint } = useResponsiveDevice();
  const shouldDisplayParticipantsModalButton = isStageActive && isHost;

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
          currentBreakpoint === BREAKPOINTS.xxs
            ? 'origin-bottom-right'
            : 'origin-top-left',
          'p-4',
          'rounded-3xl',
          'w-auto'
        ])}
      >
        {shouldDisplayParticipantsModalButton && (
          <Button
            variant="tertiaryText"
            onClick={noop}
            className={clsm(BUTTON_TEXT_CLASSES)}
          >
            <Group className={IconClasses} />
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
