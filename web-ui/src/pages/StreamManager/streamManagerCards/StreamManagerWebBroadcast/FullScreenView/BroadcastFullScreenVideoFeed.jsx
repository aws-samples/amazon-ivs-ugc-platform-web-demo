import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { clsm } from '../../../../../utils';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import Spinner from '../../../../../components/Spinner';

const BroadcastFullScreenVideoFeed = () => {
  const { fullscreen } = useSelector((state) => state.streamManager);
  const canvasRef = useRef();
  const { setupVideoPreview } = useBroadcast();
  const { parentRef: containerRef, responsiveVideoClasses } =
    useCalculatedAspectRatio({
      childRef: canvasRef
    });

  useEffect(() => {
    if (!fullscreen.isAnimating && fullscreen.isOpen) {
      setupVideoPreview(canvasRef);
    }
  }, [setupVideoPreview, fullscreen.isOpen, canvasRef, fullscreen.isAnimating]);

  if (fullscreen.isAnimating)
    return (
      <div
        className={clsm([
          'flex',
          'w-full',
          'h-full',
          'justify-center',
          'items-center'
        ])}
      >
        <Spinner variant="light" size="large" />
      </div>
    );

  return (
    <div
      ref={containerRef}
      className={clsm([
        'bg-black',
        'flex-col',
        'flex',
        'h-full',
        'items-center',
        'overflow-hidFden',
        'relative',
        'rounded-xl',
        'w-full',
        fullscreen.isOpen && 'min-h-[200px]'
      ])}
    >
      <canvas
        ref={canvasRef}
        className={clsm([
          '-translate-y-1/2',
          'absolute',
          'top-1/2',
          responsiveVideoClasses
        ])}
      />
    </div>
  );
};

export default BroadcastFullScreenVideoFeed;
