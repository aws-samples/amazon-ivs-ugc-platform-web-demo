import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BREAKPOINTS,
  PARTICIPANT_TYPES,
  STAGE_LEFT_REASONS
} from '../../../../../constants';
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
import ExpandedGoLiveContainer from '../ExpandedGoLiveContainer';
import { useDispatch, useSelector } from 'react-redux';
import {
  finalizeCollaborationExit,
  updateCollaborateStates
} from '../../../../../reducers/shared';
import {
  StageFactory,
  useStageManager
} from '../../../../../contexts/StageManager';
import { resetStreamManagerStates } from '../../../../../reducers/streamManager';
import useFetchHostData from '../../../hooks/useFetchHostData';

const $stageContent = $content.stream_manager_stage;

const { destroyStages } = StageFactory;

const JoinModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { collaborate } = useSelector((state) => state.shared);
  const { isModalOpen, type, openModal, closeModal } = useModal();
  const { isLandscape, isMobileView } = useResponsiveDevice();
  const { stageControls = null } = useStageManager() || {};
  const { hostChannelData, fetchHostChannelError, setShouldFetchHostData } =
    useFetchHostData();
  const { enterCollaborateSession } = stageControls || {};
  const isStageJoinModal = type === MODAL_TYPE.STAGE_JOIN;
  const isStageDeleted =
    collaborate.leftReason === STAGE_LEFT_REASONS.STAGE_DELETED;
  const isDisconnected =
    collaborate.leftReason === STAGE_LEFT_REASONS.PARTICIPANT_DISCONNECTED;
  const isStageSessionEnded =
    collaborate.leftReason === STAGE_LEFT_REASONS.SESSION_ENDED;

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

  const onCancel = useCallback(() => {
    dispatch(resetStreamManagerStates());
    dispatch(updateCollaborateStates({ isLeaving: true }));
  }, [dispatch]);

  const onConfirm = useCallback(async () => {
    await enterCollaborateSession();

    dispatch(
      updateCollaborateStates({
        isJoining: false
      })
    );
    closeModal({ shouldCancel: false, shouldRefocus: false });
  }, [enterCollaborateSession, dispatch, closeModal]);

  useEffect(() => {
    if (collaborate.isJoining) {
      openModal({
        type: MODAL_TYPE.STAGE_JOIN,
        onCancel: onCancel
      });
    }
  }, [collaborate.isJoining, openModal, onCancel]);

  useEffect(() => {
    if (
      (isStageDeleted || isDisconnected || isStageSessionEnded) &&
      isModalOpen
    ) {
      closeModal({ shouldCancel: false, shouldRefocus: false });
    }
  }, [
    collaborate.leftReason,
    isDisconnected,
    isStageDeleted,
    isStageSessionEnded,
    closeModal,
    isModalOpen
  ]);

  /**
   * As an invited or requested participant in the process of joining a stage at the StageJoinModal view,
   * If the host leaves the collaborate session then leave stage
   */
  useEffect(() => {
    if (
      [PARTICIPANT_TYPES.INVITED, PARTICIPANT_TYPES.REQUESTED].includes(
        collaborate.participantType
      ) &&
      collaborate.isJoining &&
      collaborate.host.username
    ) {
      setShouldFetchHostData(true);

      if (hostChannelData && !fetchHostChannelError) {
        const { stageId } = hostChannelData;

        if (!stageId) {
          dispatch(
            updateCollaborateStates({
              leftReason: STAGE_LEFT_REASONS.SESSION_ENDED,
              isLeaving: true
            })
          );
          setShouldFetchHostData(false);
        }
      }
    } else {
      setShouldFetchHostData(false);
    }
  }, [
    collaborate.host.username,
    collaborate.isJoining,
    collaborate.participantType,
    dispatch,
    fetchHostChannelError,
    hostChannelData,
    setShouldFetchHostData
  ]);

  /**
   * If the Redux shared slice collaborate state has "isLeaving" set to true,
   * should destroy all stage instances, navigate back to the default stream manager route ('/manager') and finalizeCollaborationExit which is display the proper toast message
   */
  useEffect(() => {
    if (
      [PARTICIPANT_TYPES.INVITED, PARTICIPANT_TYPES.REQUESTED].includes(
        collaborate.participantType
      ) &&
      collaborate.isJoining &&
      collaborate.isLeaving
    ) {
      destroyStages();
      navigate('/manager');
      dispatch(finalizeCollaborationExit(collaborate.leftReason));
    }
  }, [
    collaborate.isJoining,
    collaborate.isLeaving,
    collaborate.leftReason,
    collaborate.participantType,
    dispatch,
    navigate
  ]);

  return (
    isStageJoinModal &&
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
          <ExpandedGoLiveContainer
            withHeader={false}
            withScreenshareButton={false}
            withStageControl={false}
            goliveButtonClassNames={clsm([
              isMobileView ? ['absolute', 'bottom-0', 'left-0', 'p-4'] : 'pt-5'
            ])}
            onGoLiveStreamButtonClick={onConfirm}
            isOpen
          />
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
