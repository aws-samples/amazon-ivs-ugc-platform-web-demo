import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { clsm, noop } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import StageVideoFeeds, {
  STAGE_VIDEO_FEEDS_TYPES
} from '../StageVideoFeeds/StageVideoFeeds';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import BroadcastFullScreenVideoFeed from './BroadcastFullScreenVideoFeed';
import Footer from './Footer';
import Header from './Header';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import useResize from '../../../../../hooks/useResize';
import withPortal from '../../../../../components/withPortal';

const FullScreenView = () => {
  const { isStageActive } = useStreamManagerStage();
  const {
    isJoiningStageByRequestOrInvite,
    shouldOpenSettingsModal,
    updateShouldOpenSettingsModal
  } = useGlobalStage();
  const { handleOpenJoinModal } = useStreamManagerStage();
  const {
    isFullScreenViewOpen,
    dimensions,
    initializeGoLiveContainerDimensions
  } = useBroadcastFullScreen();
  const { resetPreview } = useBroadcast();
  const { openModal, isModalOpen } = useModal();
  const fullScreenViewContainerRef = useRef();
  const { isMobileView, dimensions: windowDimensions } = useResponsiveDevice();
  const { height: windowHeight } = windowDimensions;
  const shouldAddScrollbar = windowHeight <= 350;
  const content =
    isStageActive || isJoiningStageByRequestOrInvite ? (
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

  useResize(initializeGoLiveContainerDimensions);

  useEffect(() => {
    if (!isModalOpen && isJoiningStageByRequestOrInvite) {
      handleOpenJoinModal();
      resetPreview();
    }
  }, [
    isModalOpen,
    handleOpenJoinModal,
    resetPreview,
    isJoiningStageByRequestOrInvite
  ]);

  useEffect(() => {
    if (shouldOpenSettingsModal && !isMobileView) {
      openModal({
        type: MODAL_TYPE.STREAM_BROADCAST_SETTINGS,
        onCancel: isJoiningStageByRequestOrInvite ? handleOpenJoinModal : noop
      });
      updateShouldOpenSettingsModal(false);
    }
  }, [
    isJoiningStageByRequestOrInvite,
    handleOpenJoinModal,
    openModal,
    isMobileView,
    shouldOpenSettingsModal,
    updateShouldOpenSettingsModal
  ]);

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
            borderRadius: 0,
            display: 'block'
          }
        },
        transition: ANIMATION_TRANSITION,
        options: {
          isVisible: isFullScreenViewOpen,
          shouldAnimateIn: !isJoiningStageByRequestOrInvite
        }
      })}
      className={clsm([
        'absolute',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'overflow-hidden',
        shouldAddScrollbar && ['overflow-y-scroll', 'overflow-x-hidden'],
        isMobileView ? 'z-[300]' : 'z-[700]',
        isJoiningStageByRequestOrInvite && [
          'w-full',
          'h-full',
          'top-0',
          'left-0'
        ]
      ])}
    >
      {!isJoiningStageByRequestOrInvite && <Header />}
      <motion.div
        className={clsm([
          'flex',
          'flex-col',
          'justify-between',
          'h-full',
          isJoiningStageByRequestOrInvite && ['p-8', 'pb-0']
        ])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 64,
              paddingTop: 72
            },
            visible: {
              paddingLeft: isMobileView ? 16 : 32,
              paddingRight: isMobileView ? 16 : 32,
              paddingBottom: 0,
              paddingTop: isMobileView ? 16 : 32
            }
          },
          transition: ANIMATION_TRANSITION,
          options: {
            shouldAnimateIn: !isJoiningStageByRequestOrInvite
          }
        })}
      >
        {content}
        <Footer shouldAddScrollbar={shouldAddScrollbar} />
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
