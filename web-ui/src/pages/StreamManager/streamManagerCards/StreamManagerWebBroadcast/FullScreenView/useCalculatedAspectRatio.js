import { useCallback, useEffect, useRef } from 'react';

import { fitRectIntoContainer } from '../../../../../helpers/webBroadcastHelpers';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import useResizeObserver from '../../../../../hooks/useResizeObserver';

const useCalculatedAspectRatio = ({
  childRef,
  delay = 0,
  isAnimated = true
} = {}) => {
  const {
    setDimensionClasses,
    fullscreenAnimationControls,
    isFullScreenViewOpen
  } = useBroadcastFullScreen();
  const { isDesktopView } = useResponsiveDevice();
  const parentRef = useRef();

  const animateWidthHeight = useCallback(() => {
    if (!isFullScreenViewOpen) return;

    setDimensionClasses([]);
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

      if (isAnimated) {
        fullscreenAnimationControls.start(controlAnimDefinition);
      } else {
        fullscreenAnimationControls.set(controlAnimDefinition);
      }
    }, delay);
  }, [
    delay,
    isFullScreenViewOpen,
    setDimensionClasses,
    childRef,
    fullscreenAnimationControls,
    isAnimated
  ]);

  useResizeObserver(childRef, animateWidthHeight);
  useResizeObserver(parentRef, animateWidthHeight);

  useEffect(() => {
    if (!isFullScreenViewOpen) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const aspectRatioProportion = 0.667; // 3:2 aspect ratio or 2/3
    const initialDimensionClasses = [
      'aspect-video',
      'max-w-[calc(100vw_-_64px)]', // Maximum width considering 64px combined padding
      windowHeight / windowWidth < aspectRatioProportion
        ? ['w-auto', 'h-full']
        : ['w-full', 'h-auto']
    ];

    // Updating the initial dimensions of the canvas will make the canvas dimension animation smoother once the animation completes
    setDimensionClasses(initialDimensionClasses);
  }, [setDimensionClasses, isFullScreenViewOpen]);

  useEffect(() => {
    if (!isFullScreenViewOpen) setDimensionClasses([]);
  }, [isDesktopView, setDimensionClasses, isFullScreenViewOpen]);

  return {
    parentRef
  };
};

export default useCalculatedAspectRatio;
