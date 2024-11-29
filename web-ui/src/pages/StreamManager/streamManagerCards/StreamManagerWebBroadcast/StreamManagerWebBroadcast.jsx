import { forwardRef, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { CreateVideo } from '../../../../assets/icons';
import { clsm, noop } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import FloatingNav from '../../../../components/FloatingNav';
import ExpandedGoLiveContainer from './ExpandedGoLiveContainer';
import CollapsedGoLiveContainer from './CollapsedGoLiveContainer';
import {
  updateAnimationInitialStates,
  updateGoLiveContainerStates
} from '../../../../reducers/streamManager';
import { GO_LIVE_BUTTON_CLASSES } from './styleClasses';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const StreamManagerWebBroadcast = forwardRef(
  ({ setIsWebBroadcastAnimating }, previewRef) => {
    const dispatch = useDispatch();
    const { goLiveContainer, fullscreen } = useSelector(
      (state) => state.streamManager
    );
    const { collaborate } = useSelector((state) => state.shared);
    const { isBroadcasting } = useBroadcast();
    const { isDesktopView } = useResponsiveDevice();
    const webBroadcastContainerRef = useRef();

    const isDefaultGoLiveButton =
      !goLiveContainer.isOpen && !isBroadcasting && isDesktopView;

    const handleGoLiveContainerExpand = useCallback(() => {
      dispatch(updateGoLiveContainerStates({ isOpen: true }));
    }, [dispatch]);

    const handleGoLiveContainerCollapse = () => {
      dispatch(updateGoLiveContainerStates({ isOpen: false }));
    };

    const updateFullscreenWidthHeight = useCallback(() => {
      /**
       * The web broadcast container's width and height is used to set the
       * initial width and height of the fullscreen before it expands to a
       * full sized component
       */
      const initialWidth = webBroadcastContainerRef.current.offsetWidth;
      const initialHeight = webBroadcastContainerRef.current.offsetHeight;

      dispatch(
        updateAnimationInitialStates({
          fullscreenWidth: initialWidth,
          fullscreenHeight: initialHeight
        })
      );
    }, [dispatch, webBroadcastContainerRef]);

    return (
      <section
        ref={webBroadcastContainerRef}
        className={clsm([
          'w-full',
          'h-fit',
          'grid',
          'bg-lightMode-gray-extraLight',
          'dark:bg-darkMode-gray-dark',
          'lg:max-w-full',
          'max-w-[351px]',
          'p-5',
          'rounded-3xl',
          'mb-6'
        ])}
      >
        <ExpandedGoLiveContainer
          ref={!fullscreen.isOpen && !collaborate.isJoining ? previewRef : null}
          isOpen={goLiveContainer.isOpen}
          onCollapse={handleGoLiveContainerCollapse}
          setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
          onExpandAnimationComplete={updateFullscreenWidthHeight}
        />
        {!goLiveContainer.isOpen && isBroadcasting && isDesktopView && (
          <CollapsedGoLiveContainer
            isOpen={!goLiveContainer.isOpen}
            onExpand={handleGoLiveContainerExpand}
          />
        )}
        {isDefaultGoLiveButton && (
          <Button
            onClick={handleGoLiveContainerExpand}
            variant="primary"
            className={clsm(GO_LIVE_BUTTON_CLASSES)}
            data-testid="web-broadcast-go-live-button"
          >
            <CreateVideo />
            <p>{$webBroadcastContent.go_live}</p>
          </Button>
        )}
        <FloatingNav />
      </section>
    );
  }
);

StreamManagerWebBroadcast.propTypes = {
  setIsWebBroadcastAnimating: PropTypes.func
};

StreamManagerWebBroadcast.defaultProps = {
  setIsWebBroadcastAnimating: noop
};

export default StreamManagerWebBroadcast;
