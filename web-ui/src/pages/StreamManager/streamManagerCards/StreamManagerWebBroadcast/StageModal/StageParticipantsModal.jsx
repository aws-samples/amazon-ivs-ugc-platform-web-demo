import { useCallback } from 'react';
import { useSelector } from 'react-redux';

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
import StageParticipant from './StageParticipant';
import StageRequestee from './StageRequestee';
import { useStageManager } from '../../../../../contexts/StageManager';
import { PARTICIPANT_GROUP } from '../../../../../contexts/StageManager/constants';

const $content = $streamManagerContent.stream_manager_stage;

const StageParticipantsModal = () => {
  const { collaborate } = useSelector((state) => state.shared);
  const { closeModal, isModalOpen, type } = useModal();
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const {
    [PARTICIPANT_GROUP.USER]: userStage = null,
    [PARTICIPANT_GROUP.DISPLAY]: displayStage
  } = useStageManager() || {};
  const publishingParticipants = [
    ...(displayStage?.getParticipants({
      isPublishing: true,
      canSubscribeTo: true
    }) || []),
    ...(userStage?.getParticipants({
      isPublishing: true,
      canSubscribeTo: true
    }) || [])
  ];

  const renderStageParticipantsModal = useCallback(
    (children) => (
      <>
        {
          /**
           * We mount/unmount the responsive panel to skip the enter and exit
           * animations when switching between desktop and mobile views
           */
          isMobileView ? (
            <ResponsivePanel
              isOpen={isModalOpen}
              mobileBreakpoint={isLandscape ? BREAKPOINTS.lg : BREAKPOINTS.md}
              panelId="stage-participants-panel"
              preserveVisible
              shouldSetVisible={false}
            >
              {children}
            </ResponsivePanel>
          ) : (
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
          )
        }
      </>
    ),
    [isLandscape, isMobileView, isModalOpen]
  );

  const availableSpotMessage = `${$content.participants} (${publishingParticipants.length}/12)`;

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
            {publishingParticipants.map((participant, index) => (
              <StageParticipant
                participant={participant}
                key={`${participant.id}-${index}`}
              />
            ))}
          </div>
          <div className="mt-12">
            <h4>{$content.requests}</h4>
            {collaborate.requestList.map((requestee, index) => (
              <StageRequestee
                requestee={requestee}
                key={`${requestee.channelId}-${index}`}
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

export default StageParticipantsModal;
