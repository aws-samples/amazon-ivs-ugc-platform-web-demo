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
import { useAppSync } from '../../../../../contexts/AppSync';
import channelEvents from '../../../../../contexts/AppSync/channelEvents';

const $content = $streamManagerContent.stream_manager_stage;

const StageParticipantsModal = () => {
  const { closeModal, isModalOpen, type } = useModal();
  const { participantsArrayExcludingHost } = useGlobalStage();
  const { isMobileView, isLandscape } = useResponsiveDevice();

  const renderStageParticipantsModal = (children) => (
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

  const { publish } = useAppSync();

  // TODO: Move function to appropriate component
  // eslint-disable-next-line no-unused-vars
  const acceptStageRequest = () => {
    const requesteeChannelId = '<PARTICIPANT_CHANNEL_ID>';
    publish(
      requesteeChannelId,
      JSON.stringify({
        type: channelEvents.STAGE_HOST_ACCEPT_REQUEST_TO_JOIN
      })
    );
  };

  return (
    type === MODAL_TYPE.STAGE_PARTICIPANTS &&
    renderStageParticipantsModal(
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
            {[...participantsArrayExcludingHost].map(([_, participant]) => (
              <StageParticipant participant={participant} />
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

export default StageParticipantsModal;
