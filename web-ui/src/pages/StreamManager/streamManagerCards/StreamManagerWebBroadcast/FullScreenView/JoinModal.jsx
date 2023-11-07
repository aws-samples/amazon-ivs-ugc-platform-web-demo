import { BREAKPOINTS } from '../../../../../constants';
import { clsm } from '../../../../../utils';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Modal from '../../../../../components/Modal';
import ResponsivePanel from '../../../../../components/ResponsivePanel';
import { MODAL_CLOSE_BUTTON_CLASSES, getModalContainerClasses, getModalFormClasses } from '../../StreamManagerModalTheme';
import { Close } from '../../../../../assets/icons';
import Button from '../../../../../components/Button/Button';

const JoinModal = () => {
  const { isModalOpen, type, closeModal } = useModal();
  const { isMobileView, isLandscape } = useResponsiveDevice();

  const renderJoinModal = (children) => (
    <>
      {
        /**
         * We mount/unmount the responsive panel to skip the enter and exit
         * animations when switching between desktop and mobile views
         */
        isMobileView && (
          <ResponsivePanel
            isOpen={isModalOpen}
            mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
            panelId="stage-participants-panel"
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
    type === MODAL_TYPE.STAGE_JOIN_MODAL &&
    renderJoinModal(
      <div
        className={clsm(
          getModalFormClasses(isLandscape),
          'justify-start',
          'h-[85vh]'
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
              'max-w-[calc(calc(var(--mobile-vw,1vw)_*_100)_-_120px)]'
            ])}
          >
            Ready to join?
          </h2>
       </div>
       <Button
          ariaLabel="Close the stage participants modal"
          className={clsm(MODAL_CLOSE_BUTTON_CLASSES)}
          onClick={closeModal}
          variant="icon"
        >
          <Close />
        </Button>
      </div>
    )
  );
};

export default JoinModal;
