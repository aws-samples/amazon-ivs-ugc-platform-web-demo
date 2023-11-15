import { BREAKPOINTS } from '../../../../../constants';
import { clsm } from '../../../../../utils';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Modal from '../../../../../components/Modal';
import ResponsivePanel from '../../../../../components/ResponsivePanel';
import {
  MODAL_CLOSE_BUTTON_CLASSES,
  getModalContainerClasses,
  getModalFormClasses
} from '../../StreamManagerModalTheme';
import { streamManager as $content } from '../../../../../content';
import { Close } from '../../../../../assets/icons';
import Button from '../../../../../components/Button/Button';
import GoLiveContainer from '../GoLiveContainer';
import { useBroadcast } from '../../../../../contexts/Broadcast';

const $stageContent = $content.stream_manager_stage;

const JoinModal = () => {
  const { isModalOpen, type } = useModal();
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const { previewRef } = useBroadcast();

  const handleCloseJoinModal = () => {
    window.history.replaceState({}, document.title);
    window.location.href = '/manager';
  };

  const renderJoinModal = (children) => (
    <>
      {
        /**
         * We mount/unmount the responsive panel to skip the enter and exit
         * animations when switching between desktop and mobile views
         */
        isMobileView && (
          <ResponsivePanel
            shouldSetVisible={false}
            isOpen={isModalOpen}
            mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
            panelId="stage-join-modal-panel"
            preserveVisible
          >
            {children}
          </ResponsivePanel>
        )
      }
      <Modal
        isOpen={isModalOpen && !isMobileView}
        className={clsm([
          'bg-white',
          'dark:bg-darkMode-gray-medium',
          'max-w-[592px]',
          'p-0',
          'relative',
          'w-full'
        ])}
      >
        {children}
      </Modal>
    </>
  );

  return (
    type === MODAL_TYPE.STAGE_JOIN &&
    renderJoinModal(
      <div
        className={clsm(
          getModalFormClasses(isLandscape),
          'justify-start',
          'h-auto',
          'pb-12'
        )}
      >
        <div
          className={clsm([
            getModalContainerClasses(isLandscape),
            'overflow-hidden'
          ])}
        >
          <h2
            className={clsm([
              'text-center',
              'text-black',
              'dark:text-white',
              'm-auto',
              'max-w-[calc(calc(var(--mobile-vw,1vw)_*_100)_-_120px)]',
              'mb-12'
            ])}
          >
            {$stageContent.join_modal.ready_to_join}
          </h2>
          <GoLiveContainer
            ref={previewRef}
            withHeader={false}
            withScreenshareButton={false}
            withStageControl={false}
            goliveButtonClassNames={clsm([
              isMobileView ? ['absolute', 'bottom-0', 'left-0', 'p-4'] : 'pt-5'
            ])}
            isOpen
          />
        </div>
        <Button
          ariaLabel="Close the stage participants modal"
          className={clsm(MODAL_CLOSE_BUTTON_CLASSES)}
          onClick={handleCloseJoinModal}
          variant="icon"
        >
          <Close />
        </Button>
      </div>
    )
  );
};

export default JoinModal;
