import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { ChevronDown, ChevronUp, ExpandScreen } from '../../../../assets/icons';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import Button from '../../../../components/Button/Button';
import { useStreamManagerStage } from '../../../../contexts/Stage';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { useBroadcastFullScreen } from '../../../../contexts/BroadcastFullscreen';
import { useGlobalStage } from '../../../../contexts/Stage';

const GoLiveHeader = ({ onCollapse }) => {
  const { isBroadcasting, resetPreview } = useBroadcast();
  const { isStageActive } = useStreamManagerStage();
  const {
    collaborateButtonAnimationControls,
    animateCollapseStageContainerWithDelay,
    shouldAnimateGoLiveButtonChevronIcon
  } = useGlobalStage();
  const {
    handleToggleFullscreen,
    isFullScreenViewOpen,
    setShouldRenderFullScreenCollaborateButton
  } = useBroadcastFullScreen();

  const handleOpenFullScreen = () => {
    if (!isStageActive) setShouldRenderFullScreenCollaborateButton(true);
    collaborateButtonAnimationControls.start({ zIndex: 0 });
    handleToggleFullscreen();
  };

  useEffect(() => {
    if (!isStageActive) {
      resetPreview();
    }
  }, [resetPreview, isFullScreenViewOpen, isStageActive]);

  return (
    <div className={clsm(['flex', 'justify-between', 'items-center', 'mb-5'])}>
      <Button
        isDisabled={animateCollapseStageContainerWithDelay}
        onClick={onCollapse}
        variant="primaryText"
        className={clsm([
          'dark:text-white',
          'text-black',
          'dark:[&>svg]:fill-white',
          'dark:focus:none',
          '[&>svg]:fill-black',
          '!opacity-100',
          'h-8',
          'pl-1',
          'pr-3',
          'focus:bg-transparent',
          'focus:dark:bg-transparent',
          '[&>svg]:w-6',
          '[&>svg]:h-6',
          '[&>svg]:mr-2'
        ])}
      >
        {isBroadcasting || shouldAnimateGoLiveButtonChevronIcon ? (
          <AnimatePresence>
            <motion.div
              className={clsm([
                '[&>svg]:w-6',
                '[&>svg]:h-6',
                '[&>svg]:mr-2',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black'
              ])}
              {...(isStageActive &&
                createAnimationProps({
                  transition: {
                    type: 'easeInOut',
                    from: animateCollapseStageContainerWithDelay ? 0.3 : 1,
                    ...(!animateCollapseStageContainerWithDelay && {
                      delay: 0.5,
                      duration: 0.3
                    })
                  },
                  controls: { opacity: 0.3 },
                  options: {
                    shouldAnimate: shouldAnimateGoLiveButtonChevronIcon
                  }
                }))}
            >
              <ChevronUp />
            </motion.div>
          </AnimatePresence>
        ) : (
          <ChevronDown />
        )}
        <p>{$content.stream_manager_web_broadcast.go_live}</p>
      </Button>
      <Button
        ariaLabel={$content.stream_manager_web_broadcast.expand}
        variant="icon"
        onClick={handleOpenFullScreen}
        className={clsm([
          'dark:[&>svg]:fill-white',
          '[&>svg]:fill-black',
          'p-2',
          'dark:bg-darkMode-gray',
          'bg-lightMode-gray',
          'hover:bg-lightMode-gray-hover',
          'dark:focus:bg-darkMode-gray'
        ])}
      >
        <ExpandScreen className={clsm(['w-4', 'h-4'])} />
      </Button>
    </div>
  );
};

GoLiveHeader.propTypes = {
  onCollapse: PropTypes.func.isRequired
};

export default GoLiveHeader;
