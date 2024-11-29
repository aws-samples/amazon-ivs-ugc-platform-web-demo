import { useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { VIDEO_LAYER_NAME } from '../../../../contexts/Broadcast/useLayers';
import { Close, AccountBox } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { AUDIO_INPUT_NAME } from '../../../../contexts/Broadcast/useAudioMixer';
import {
  MODAL_CLOSE_BUTTON_CLASSES,
  MODAL_OVERFLOW_DIVIDER_CLASSES,
  getFormHeaderClasses,
  getModalContainerClasses,
  getModalFormClasses
} from '../StreamManagerModalTheme';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useDeviceManager } from '../../../../contexts/DeviceManager';
import Button from '../../../../components/Button';
import SwitchGroup from '../StreamManagerWebBroadcast/formElements/SwitchGroup';
import useResizeObserver from '../../../../hooks/useResizeObserver';
import { useStageManager } from '../../../../contexts/StageManager';
import DeviceDropdown from './DeviceDropdown';
import ResponsiveSettings from './ResponsiveSettings';

const $content = $streamManagerContent.web_broadcast_audio_video_settings_modal;

const BroadcastSettingsModal = () => {
  const { collaborate } = useSelector((state) => state.shared);
  const {
    userMedia: {
      activeDevices,
      updateActiveDevice,
      devices,
      videoStopped,
      audioMuted,
      broadcast: {
        shouldShowCameraOnScreenShare,
        updateShouldShowCameraOnScreenShare
      }
    }
  } = useDeviceManager();
  const { user: userStage = null } = useStageManager() || {};
  const isStageActive = userStage?.isConnected;
  const { closeModal, handleConfirm, isModalOpen, type } = useModal();
  const { isTouchscreenDevice, isMobileView, isLandscape } =
    useResponsiveDevice();

  const onClickAway = useCallback(() => {
    closeModal({ shouldRefocus: false });
  }, [closeModal]);

  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const mainContentRef = useRef();
  useResizeObserver(
    mainContentRef,
    (entry) => {
      if (entry) {
        const { scrollHeight, clientHeight } = entry.target;
        setIsContentOverflowing(scrollHeight > clientHeight);
      }
    },
    isModalOpen
  );

  const displayShowCameraToggle =
    !isTouchscreenDevice && !isStageActive && !collaborate.isJoining;

  return (
    isModalOpen &&
    type === MODAL_TYPE.STREAM_BROADCAST_SETTINGS && (
      <ResponsiveSettings
        isMobileView={isMobileView}
        isLandscape={isLandscape}
        onClickAway={onClickAway}
        shouldSetVisible={false}
      >
        <div className={clsm(getModalFormClasses(isLandscape))}>
          <div
            ref={mainContentRef}
            className={clsm(getModalContainerClasses(isLandscape))}
          >
            <h2 className={getFormHeaderClasses(false)}>
              {$content.audio_and_video_settings}
            </h2>
            <div className={clsm(['flex', 'flex-col', 'space-y-8', 'pb-12'])}>
              {Object.entries(devices)
                .sort(([n1], [n2]) => {
                  const sortingArr = [AUDIO_INPUT_NAME, VIDEO_LAYER_NAME];

                  return sortingArr.indexOf(n1) - sortingArr.indexOf(n2);
                })
                .map(([deviceName, devicesList], index) => (
                  <DeviceDropdown
                    key={`${deviceName}-${index}`}
                    deviceName={deviceName}
                    devicesList={devicesList}
                    activeDevices={activeDevices}
                    updateActiveDevice={updateActiveDevice}
                    videoStopped={videoStopped}
                    audioMuted={audioMuted}
                  />
                ))}
              {displayShowCameraToggle && (
                <SwitchGroup
                  icon={<AccountBox />}
                  label={$content.show_camera_on_screen_share}
                  onChange={updateShouldShowCameraOnScreenShare}
                  initialChecked={shouldShowCameraOnScreenShare}
                />
              )}
            </div>
          </div>
          <Button
            ariaLabel="Close the audio and video settings modal"
            className={clsm(MODAL_CLOSE_BUTTON_CLASSES)}
            onClick={closeModal}
            variant="icon"
          >
            <Close />
          </Button>
          <footer
            className={clsm(
              [
                'flex',
                'items-center',
                'justify-between',
                'px-12',
                'pb-12',
                'md:p-4'
              ],
              isLandscape && 'touch-screen-device:lg:p-4',
              isContentOverflowing && MODAL_OVERFLOW_DIVIDER_CLASSES
            )}
          >
            <Button onClick={handleConfirm} className="w-full">
              {$content.done}
            </Button>
          </footer>
        </div>
      </ResponsiveSettings>
    )
  );
};

export default BroadcastSettingsModal;
