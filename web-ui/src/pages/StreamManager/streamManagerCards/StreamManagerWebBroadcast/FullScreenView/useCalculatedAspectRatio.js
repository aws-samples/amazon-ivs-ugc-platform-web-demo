import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { fitRectIntoContainer } from '../../../../../helpers/webBroadcastHelpers';
import useResize from '../../../../../hooks/useResize';

const VIDEO_CLASSES_DEFAULT = [];

const useCalculatedAspectRatio = ({ childRef, delay = 0 } = {}) => {
  const {
    fullscreen: { isOpen: isFullscreenOpen }
  } = useSelector((state) => state.streamManager);
  const parentRef = useRef();
  const [responsiveVideoClasses, setResponsiveVideoClasses] = useState(
    VIDEO_CLASSES_DEFAULT
  );
  const [controlAnimDefinition, setControlAnimDefinition] = useState(null);

  const getResponsiveVideoClasses = useCallback(() => {
    if (isFullscreenOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const aspectRatioProportion = 0.667; // 3:2 aspect ratio or 2/3
      const responsiveVideoClasses = [
        'aspect-video',
        'max-w-[calc(100vw_-_64px)]', // Maximum width considering 64px combined padding
        windowHeight / windowWidth < aspectRatioProportion
          ? ['w-auto', 'h-full']
          : ['w-full', 'h-auto']
      ];

      // Updating the initial responsive video classes of the canvas will make the canvas dimension animation smoother once the animation completes
      setResponsiveVideoClasses(responsiveVideoClasses);
    } else {
      setResponsiveVideoClasses(VIDEO_CLASSES_DEFAULT);
    }
  }, [isFullscreenOpen]);

  const animateWidthHeight = useCallback(() => {
    getResponsiveVideoClasses();

    if (isFullscreenOpen) {
      setTimeout(() => {
        const { width: newCanvasWidth, height: newCanvasHeight } =
          fitRectIntoContainer(
            childRef?.current?.clientWidth,
            childRef?.current?.clientHeight,
            parentRef?.current?.clientWidth,
            parentRef?.current?.clientHeight
          );
        const controlAnimDefinition = {
          width: newCanvasWidth,
          height: newCanvasHeight
        };

        setControlAnimDefinition(controlAnimDefinition);
      }, delay);
    }
  }, [getResponsiveVideoClasses, isFullscreenOpen, delay, childRef]);

  useResize(animateWidthHeight, { shouldCallOnMount: true });

  return {
    parentRef,
    responsiveVideoClasses,
    controlAnimDefinition,
    setControlAnimDefinition
  };
};

export default useCalculatedAspectRatio;
