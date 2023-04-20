import { useRef, useState } from 'react';

import { BREAKPOINTS } from '../../../../constants';
import { CAMERA_LAYER_NAME } from '../../../../contexts/Broadcast/useLayers';
import { Close, AccountBox } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../../../contexts/Broadcast/useAudioMixer';
import {
  MODAL_CLOSE_BUTTON_CLASSES,
  MODAL_FORM_HEADER_CLASSES,
  MODAL_OVERFLOW_DIVIDER_CLASSES,
  getModalContainerClasses,
  getModalFormClasses
} from '../StreamManagerModalTheme';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useBroadcast } from '../../../../contexts/Broadcast';
import Button from '../../../../components/Button';
import Dropdown from '../../../../components/Dropdown';
import Modal from '../../../../components/Modal';
import ResponsivePanel from '../../../../components/ResponsivePanel';
import SwitchGroup from './formElements/SwitchGroup';
import useResizeObserver from '../../../../hooks/useResizeObserver';

const $content = $streamManagerContent.web_broadcast_audio_video_settings_modal;

const WebBroadcastSettingsModal = () => {
  const { closeModal, handleConfirm, isModalOpen, type } = useModal();
  const { isTouchscreenDevice, isMobileView, isLandscape } =
    useResponsiveDevice();
  const {
    activeDevices,
    devices,
    isCameraHidden,
    isMicrophoneMuted,
    shouldShowCameraOnScreenShare,
    updateActiveDevice,
    updateShouldShowCameraOnScreenShare
  } = useBroadcast();
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

  const renderStreamBroadcastingSettingsModal = (children) => (
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
            panelId="product-learn-more-panel"
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
          'max-w-[440px]',
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
    type === MODAL_TYPE.STREAM_BROADCAST_SETTINGS &&
    renderStreamBroadcastingSettingsModal(
      <div className={clsm(getModalFormClasses(isLandscape))}>
        <div
          ref={mainContentRef}
          className={clsm(getModalContainerClasses(isLandscape))}
        >
          <h2 className={clsm(MODAL_FORM_HEADER_CLASSES)}>
            {$content.audio_and_video_settings}
          </h2>
          <div className={clsm(['flex', 'flex-col', 'space-y-8', 'pb-12'])}>
            {Object.entries(devices)
              .sort(([n1], [n2]) => {
                const sortingArr = [
                  MICROPHONE_AUDIO_INPUT_NAME,
                  CAMERA_LAYER_NAME
                ];

                return sortingArr.indexOf(n1) - sortingArr.indexOf(n2);
              })
              .map(([deviceName, devicesList]) => {
                const activeDevice = activeDevices[deviceName];
                const activeDeviceId = activeDevice?.deviceId ?? '';
                const placeholder = `${
                  $content.choose
                } ${deviceName.toLowerCase()}`;
                const options = devicesList.map(({ deviceId, label }) => ({
                  value: deviceId,
                  label
                }));
                let label, updateActiveDeviceOptions;
                if (deviceName === CAMERA_LAYER_NAME) {
                  label = $content.camera;
                  updateActiveDeviceOptions = { hidden: isCameraHidden };
                }
                if (deviceName === MICROPHONE_AUDIO_INPUT_NAME) {
                  label = $content.microphone;
                  updateActiveDeviceOptions = { muted: isMicrophoneMuted };
                }

                const onChange = (e) => {
                  const selectedDeviceId = e.target.value;
                  const device = devicesList?.find(
                    ({ deviceId }) => selectedDeviceId === deviceId
                  );

                  updateActiveDevice({
                    deviceName,
                    device,
                    options: updateActiveDeviceOptions
                  });
                };

                return (
                  <Dropdown
                    key={deviceName}
                    id={deviceName}
                    label={label}
                    selected={activeDeviceId}
                    options={options}
                    onChange={onChange}
                    placeholder={placeholder}
                  />
                );
              })}
            {!isTouchscreenDevice && (
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
          onClick={() => closeModal()}
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
    )
  );
};

export default WebBroadcastSettingsModal;
