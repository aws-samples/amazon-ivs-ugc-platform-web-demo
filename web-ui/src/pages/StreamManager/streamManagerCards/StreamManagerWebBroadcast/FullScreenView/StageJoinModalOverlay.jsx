import { useEffect } from 'react';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import { clsm } from '../../../../../utils';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { useBroadcast } from '../../../../../contexts/Broadcast';

const COMMON_BOX_CLASSES = [
  'dark:bg-darkMode-gray-medium',
  'bg-lightMode-gray-light',
  'flex',
  'justify-center',
  'items-center',
  'rounded-xl',
  'w-full',
  'h-full'
];

const StageJoinModalOverlay = () => {
  const { openModal } = useModal();
  const { resetPreview } = useBroadcast();

  useEffect(() => {
    openModal({
      type: MODAL_TYPE.STAGE_JOIN
    });
    resetPreview();
  }, [openModal, resetPreview]);

  const { dimensionClasses } = useBroadcastFullScreen();
  return (
    <div className="">
      <div
        className={clsm([
          'bg-white',
          'dark:bg-black',
          //   '-translate-y-1/2',
          //   'absolute',
          //   'grid',
          //   'h-[calc(100vh - 44px)]',
          'h-full',
          //   'overflow-hidden',
          //   'top-1/2',
          'w-full',
          'gap-4',
          //   'grid-rows-1',
          //   'grid-cols-2',
          'flex',
          'flex-row',
          dimensionClasses
        ])}
      >
        <div className={clsm(COMMON_BOX_CLASSES)} />
        <div className={clsm(COMMON_BOX_CLASSES)} />
      </div>

      <div style={{ border: '1px solid red' }} className={clsm([])}>
        footer
      </div>
    </div>
  );
};

export default StageJoinModalOverlay;
