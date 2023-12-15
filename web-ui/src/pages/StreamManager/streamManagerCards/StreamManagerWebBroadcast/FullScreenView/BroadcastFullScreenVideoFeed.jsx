import { motion } from 'framer-motion';

import { clsm } from '../../../../../utils';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';

const BroadcastFullScreenVideoFeed = () => {
  const {
    dimensionClasses,
    fullscreenAnimationControls,
    isFullScreenViewOpen,
    previewRef
  } = useBroadcastFullScreen();
  const { parentRef: containerRef } = useCalculatedAspectRatio({
    childRef: previewRef
  });

  return (
    <motion.div
      ref={containerRef}
      className={clsm([
        'bg-black',
        'flex-col',
        'flex',
        'h-full',
        'items-center',
        'overflow-hidden',
        'relative',
        'rounded-xl',
        'w-full',
        isFullScreenViewOpen && 'min-h-[200px]'
      ])}
    >
      <motion.canvas
        animate={fullscreenAnimationControls}
        ref={isFullScreenViewOpen ? previewRef : null}
        className={clsm([
          '-translate-y-1/2',
          'absolute',
          'top-1/2',
          dimensionClasses
        ])}
      />
    </motion.div>
  );
};

export default BroadcastFullScreenVideoFeed;
