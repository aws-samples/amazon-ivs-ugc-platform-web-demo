import { BREAKPOINTS } from '../../../../../constants';
import { Close } from '../../../../../assets/icons';
import { clsm } from '../../../../../utils';
import {
  MODAL_CLOSE_BUTTON_CLASSES,
  getModalContainerClasses,
  getModalFormClasses
} from '../../StreamManagerModalTheme';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { streamManager as $streamManagerContent } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Button from '../../../../../components/Button';
import Modal from '../../../../../components/Modal';
import ResponsivePanel from '../../../../../components/ResponsivePanel';
import { useGlobalStage } from '../../../../../contexts/Stage';
import StageParticipant from './StageParticipant';
import StageRequestee from './StageRequestee';

const $content = $streamManagerContent.stream_manager_stage;

const JoinModal = () => {
  const { closeModal, isModalOpen, type } = useModal();
  const { participantsArrayExcludingHost, stageRequestList } = useGlobalStage();
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

  const availableSpotMessage = `${$content.participants} (${participantsArrayExcludingHost.length}/11)`;

  return (
    type === MODAL_TYPE.STAGE_PARTICIPANTS &&
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
            {$content.participants}
          </h2>
          <div className="mt-12">
            <h4>{availableSpotMessage}</h4>
            {[...participantsArrayExcludingHost].map(([_, participant], i) => (
              <StageParticipant
                participant={participant}
                key={`${participant.id}-${i}`}
              />
            ))}
          </div>
          <div className="mt-12">
            <h4>{$content.requests}</h4>
            {stageRequestList.map((requestee, i) => (
              <StageRequestee
                requestee={requestee}
                key={`${requestee.channelId}-${i}`}
              />
            ))}
          </div>
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
