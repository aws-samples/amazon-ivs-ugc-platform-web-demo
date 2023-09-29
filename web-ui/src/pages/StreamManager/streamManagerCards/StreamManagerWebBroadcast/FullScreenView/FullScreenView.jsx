import { motion } from 'framer-motion';
import { useRef } from 'react';
import PropTypes from 'prop-types';

import {
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { useModal } from '../../../../../contexts/Modal';
import { useStage } from '../../../../../contexts/Stage';
import StageVideoFeeds, {
  STAGE_VIDEO_FEEDS_TYPES
} from '../StageVideoFeeds/StageVideoFeeds';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import withPortal from '../../../../../components/withPortal';
import BroadcastFullScreenVideoFeed from './BroadcastFullScreenVideoFeed';
import Footer from './Footer';
import Header from './Header';

const FullScreenView = ({ dimensions }) => {
  const { isStageActive } = useStage();
  const { isFullScreenViewOpen } = useBroadcastFullScreen();
  const fullScreenViewContainerRef = useRef();
  const { isModalOpen } = useModal();

  const content = isStageActive ? (
    <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.FULL_SCREEN} />
  ) : (
    <BroadcastFullScreenVideoFeed />
  );

  useFocusTrap([fullScreenViewContainerRef], !isModalOpen, {
    shouldReFocusBackOnLastClickedItem: true
  });

  const {
    animationInitialTop,
    animationInitialLeft,
    animationInitialWidth,
    animationInitialHeight
  } = dimensions;

  return (
    <motion.div
      ref={fullScreenViewContainerRef}
      key="full-screen-view"
      {...createAnimationProps({
        customVariants: {
          hidden: {
            top: animationInitialTop,
            left: animationInitialLeft,
            width: animationInitialWidth,
            height: animationInitialHeight,
            borderRadius: 24
          },
          visible: {
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0
          }
        },
        transition: ANIMATION_TRANSITION,
        options: {
          isVisible: isFullScreenViewOpen
        }
      })}
      className={clsm([
        'absolute',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'overflow-hidden',
        'z-[700]'
      ])}
    >
      <Header />
      <motion.div
        className={clsm(['flex', 'flex-col', 'justify-between', 'h-full'])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 64,
              paddingTop: 72
            },
            visible: {
              paddingLeft: 32,
              paddingRight: 32,
              paddingBottom: 0,
              paddingTop: 32
            }
          },
          transition: ANIMATION_TRANSITION
        })}
      >
        {content}
        <Footer />
      </motion.div>
    </motion.div>
  );
};

FullScreenView.propTypes = {
  dimensions: PropTypes.object.isRequired
};

export default withPortal(FullScreenView, 'full-screen-view', {
  isAnimated: true
});
