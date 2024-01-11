import { forwardRef, useCallback, useEffect, useReducer } from 'react';
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { ChevronDown, ChevronUp, ExpandScreen } from '../../../../assets/icons';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import Button from '../../../../components/Button/Button';
import useResize from '../../../../hooks/useResize';
import WebBroadcastFullScreen from './WebBroadcastFullScreen';

const GoLiveHeader = forwardRef(
  (
    {
      isFullScreen,
      onCollapse,
      setIsFullScreen,
      webBroadcastContainerRef,
      webBroadcastControllerButtons,
      webBroadcastParentContainerRef
    },
    previewRef
  ) => {
    const { isBroadcasting, resetPreview } = useBroadcast();
    const [dimensions, updateDimensions] = useReducer(
      (prevState, nextState) => ({ ...prevState, ...nextState }),
      {
        animationInitialWidth: 0,
        animationInitialHeight: 0,
        animationInitialLeft: 0,
        animationInitialTop: 0
      }
    );

    useEffect(() => {
      resetPreview();
    }, [resetPreview, isFullScreen]);

    const calculateTopAndLeftValues = useCallback(() => {
      const left = webBroadcastParentContainerRef.current.offsetLeft + 64;
      const top = webBroadcastParentContainerRef.current.offsetTop;

      return { left, top };
    }, [webBroadcastParentContainerRef]);

    const handleToggleFullscreen = () => {
      if (isFullScreen) {
        setIsFullScreen(false);
      } else {
        const { top, left } = calculateTopAndLeftValues();

        const width = webBroadcastContainerRef.current.offsetWidth;
        const height = webBroadcastContainerRef.current.offsetHeight;

        updateDimensions({
          animationInitialWidth: width,
          animationInitialHeight: height,
          animationInitialLeft: left,
          animationInitialTop: top
        });
        setIsFullScreen(true);
      }
    };

    const calculateBaseTopAndLeftOnResize = () => {
      const { top, left } = calculateTopAndLeftValues();

      updateDimensions({
        animationInitialLeft: left,
        animationInitialTop: top
      });
    };

    useResize(calculateBaseTopAndLeftOnResize);

    return (
      <div
        className={clsm(['flex', 'justify-between', 'items-center', 'mb-5'])}
      >
        <Button
          onClick={onCollapse}
          variant="primaryText"
          className={clsm([
            'dark:text-white',
            'text-black',
            'dark:[&>svg]:fill-white',
            'dark:focus:none',
            '[&>svg]:fill-black',
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
          {isBroadcasting ? <ChevronUp /> : <ChevronDown />}
          <p>{$content.stream_manager_web_broadcast.go_live}</p>
        </Button>
        {/* <Button
          onClick={onCollapse}
          variant="primaryText"
          className={clsm([
            'dark:text-white',
            'text-black',
            'dark:[&>svg]:fill-white',
            'dark:focus:none',
            '[&>svg]:fill-black',
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
          {isBroadcasting ? <ChevronUp /> : <ChevronDown />}
          <p>{$content.stream_manager_web_broadcast.start_stage}</p>
        </Button> */}
        <Button
          ariaLabel={$content.stream_manager_web_broadcast.expand}
          variant="icon"
          onClick={handleToggleFullscreen}
          className={clsm([
            'dark:[&>svg]:fill-white',
            '[&>svg]:fill-black',
            'p-2',
            'dark:bg-darkMode-gray-medium',
            'bg-lightMode-gray',
            'hover:bg-lightMode-gray-hover',
            'dark:focus:bg-darkMode-gray-medium'
          ])}
        >
          <ExpandScreen className={clsm(['w-4', 'h-4'])} />
        </Button>
        <AnimatePresence>
          {isFullScreen && (
            <WebBroadcastFullScreen
              ref={isFullScreen ? previewRef : null}
              isOpen={isFullScreen}
              parentEl={document.body}
              setIsFullScreenOpen={handleToggleFullscreen}
              webBroadcastControllerButtons={webBroadcastControllerButtons}
              dimensions={dimensions}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GoLiveHeader.propTypes = {
  isFullScreen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  setIsFullScreen: PropTypes.func.isRequired,
  webBroadcastContainerRef: PropTypes.object.isRequired,
  webBroadcastControllerButtons: PropTypes.array.isRequired,
  webBroadcastParentContainerRef: PropTypes.object.isRequired
};

export default GoLiveHeader;
