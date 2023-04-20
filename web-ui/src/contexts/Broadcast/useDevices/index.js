import { useCallback, useEffect, useRef, useState } from 'react';

import { CAMERA_LAYER_NAME } from '../useLayers';
import { getMediaDevices, requestMediaPermissions } from './utils';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../useAudioMixer';
import { streamManager as $streamManagerContent } from '../../../content';
import { useNotif } from '../../Notification';
import useStateWithCallback from '../../../hooks/useStateWithCallback';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const useDevices = ({
  addMicAudioInput,
  addVideoLayer,
  removeAudioInput,
  removeLayer,
  presetLayers,
  setError
}) => {
  const { notifySuccess } = useNotif();

  const [permissions, setPermissions] = useState({
    audio: false,
    video: false
  });
  const [devices, setDevices] = useState({
    [CAMERA_LAYER_NAME]: [],
    [MICROPHONE_AUDIO_INPUT_NAME]: []
  });
  const [activeDevices, setActiveDevices] = useStateWithCallback({
    [CAMERA_LAYER_NAME]: null,
    [MICROPHONE_AUDIO_INPUT_NAME]: null
  });

  const updateActiveDevice = useCallback(
    ({ deviceName, device, options }) => {
      if (!deviceName) return;

      let addDevice;
      if (deviceName === CAMERA_LAYER_NAME) {
        addDevice = addVideoLayer;
        options = {
          position: { index: 1 },
          layerGroupId: CAMERA_LAYER_NAME,
          ...options
        };
      }
      if (deviceName === MICROPHONE_AUDIO_INPUT_NAME) {
        addDevice = addMicAudioInput;
      }

      if (addDevice) {
        setActiveDevices(
          (prevActiveDevices) => {
            const prevActiveDevice = prevActiveDevices[deviceName];
            const didActiveDeviceChange =
              prevActiveDevice?.deviceId !== device?.deviceId;

            return didActiveDeviceChange
              ? { ...prevActiveDevices, [deviceName]: device }
              : prevActiveDevices;
          },
          async (prevActiveDevices) => {
            if (!device) return;

            const didUpdate = await addDevice(deviceName, {
              deviceId: device.deviceId,
              ...options
            });

            if (!didUpdate) {
              // If the device update failed, then switch back to the previously
              // selected active device and display an error notification
              setActiveDevices((prev) => ({
                ...prev,
                [deviceName]: prevActiveDevices[deviceName]
              }));

              let errorMessage;
              if (deviceName === CAMERA_LAYER_NAME)
                errorMessage =
                  $content.notifications.error.failed_to_change_camera;
              if (deviceName === MICROPHONE_AUDIO_INPUT_NAME)
                errorMessage =
                  $content.notifications.error.failed_to_change_mic;
              errorMessage && setError({ message: errorMessage });
            }
          }
        );
      }
    },
    [addMicAudioInput, addVideoLayer, setActiveDevices, setError]
  );

  const isRefreshingDevices = useRef(false);
  const refreshDevices = useCallback(
    async (e) => {
      const isDeviceChangeEvent = e?.type === 'devicechange';
      const nextDevices = await getMediaDevices();

      setDevices((prevDevices) => {
        if (isRefreshingDevices.current) return nextDevices;

        isRefreshingDevices.current = true;

        if (!isDeviceChangeEvent) return nextDevices;

        const deviceMap = {
          [CAMERA_LAYER_NAME]: {
            newActiveDeviceOptions: { hidden: true },
            onNewActiveDevice: () => presetLayers.noCamera.add(),
            removeActiveDevice: () => removeLayer(CAMERA_LAYER_NAME)
          },
          [MICROPHONE_AUDIO_INPUT_NAME]: {
            newActiveDeviceOptions: { muted: true },
            removeActiveDevice: () =>
              removeAudioInput(MICROPHONE_AUDIO_INPUT_NAME)
          }
        };

        // A camera or microphone device was connected or disconnected
        const deviceNames = [CAMERA_LAYER_NAME, MICROPHONE_AUDIO_INPUT_NAME];
        for (const deviceName of deviceNames) {
          const activeDevice = activeDevices[deviceName];
          const prevDevicesList = prevDevices[deviceName];
          const nextDevicesList = nextDevices[deviceName];
          const {
            newActiveDeviceOptions,
            onNewActiveDevice,
            removeActiveDevice
          } = deviceMap[deviceName];

          if (prevDevicesList.length > nextDevicesList.length) {
            // Device was disconnected
            const [disconnectedDevice] = prevDevicesList.filter(
              (prevDevice) =>
                nextDevicesList.findIndex(
                  (nextDevice) => prevDevice.deviceId === nextDevice.deviceId
                ) === -1
            );

            if (disconnectedDevice.deviceId === activeDevice.deviceId) {
              // Disconnected device was active
              const nextActiveDevice =
                nextDevicesList.find(
                  ({ deviceId }) => deviceId === 'default'
                ) || nextDevicesList[0];

              if (nextActiveDevice) {
                /**
                 * If the next active device is a camera, then update the client with
                 * a new layer pertaining to this camera device and immediately force
                 * hide it to avoid any unwanted camera switching.
                 *
                 * If the next active device is a microphone, then update the client with
                 * a new audio input pertaining to this microphone and immediately mute
                 * it to avoid any unwanted microphone switching.
                 */
                updateActiveDevice({
                  deviceName,
                  device: nextActiveDevice,
                  options: newActiveDeviceOptions
                });
                onNewActiveDevice && onNewActiveDevice();

                let updateMessage;
                if (deviceName === CAMERA_LAYER_NAME)
                  updateMessage =
                    $content.notifications.success.camera_changed_to;
                if (deviceName === MICROPHONE_AUDIO_INPUT_NAME)
                  updateMessage = $content.notifications.success.mic_changed_to;
                updateMessage &&
                  notifySuccess(`${updateMessage} ${nextActiveDevice.label}`, {
                    asPortal: true
                  });
              } else {
                // No other devices detected
                removeActiveDevice();
                updateActiveDevice(deviceName, null);
              }
            }
          } else if (prevDevicesList.length < nextDevicesList.length) {
            // New device was connected
            const [connectedDevice] = nextDevicesList.filter(
              (nextDevice) =>
                prevDevicesList.findIndex(
                  (prevDevice) => prevDevice.deviceId === nextDevice.deviceId
                ) === -1
            );

            updateActiveDevice({
              deviceName,
              device: connectedDevice,
              options: newActiveDeviceOptions
            });
            onNewActiveDevice && onNewActiveDevice();
          }
        }

        return nextDevices;
      });

      const undetectedDeviceNames = Object.entries(nextDevices).reduce(
        (deviceNames, [deviceName, devicesList]) =>
          devicesList.length ? deviceNames : [...deviceNames, deviceName],
        []
      );

      let errorMessage;
      if (undetectedDeviceNames.length === 1) {
        if (undetectedDeviceNames[0] === CAMERA_LAYER_NAME)
          errorMessage = $content.notifications.error.no_camera_detected;
        if (undetectedDeviceNames[0] === MICROPHONE_AUDIO_INPUT_NAME)
          errorMessage = $content.notifications.error.no_mic_detected;
      } else if (undetectedDeviceNames.length === 2)
        errorMessage = $content.notifications.error.no_camera_or_mic_detected;

      errorMessage && setError({ message: errorMessage });

      isRefreshingDevices.current = false;

      return nextDevices;
    },
    [
      activeDevices,
      notifySuccess,
      presetLayers.noCamera,
      removeAudioInput,
      removeLayer,
      setError,
      updateActiveDevice
    ]
  );

  const initializeDevices = useCallback(async () => {
    let mediaDevices = {};

    const onPermissionsGranted = async (permissions) => {
      // Refresh the devices list
      mediaDevices = await refreshDevices();
      setPermissions(permissions);
    };
    const onPermissionsDenied = (error) => {
      setError({
        message: $content.notifications.error.permissions_denied,
        err: error
      });
    };

    await requestMediaPermissions({
      onPermissionsGranted,
      onPermissionsDenied
    });

    // Set the default device as the initial one. If no default exists,
    // then choose the first device in the devices list as the initial one.
    for (const deviceName in mediaDevices) {
      const devicesList = mediaDevices[deviceName];
      const initialActiveDevice =
        devicesList.find(({ deviceId }) => deviceId === 'default') ||
        devicesList[0];

      if (initialActiveDevice)
        updateActiveDevice({ deviceName, device: initialActiveDevice });
    }
  }, [refreshDevices, setError, updateActiveDevice]);

  useEffect(() => {
    const { mediaDevices } = navigator;

    // A devicechange event is sent to a MediaDevices instance whenever a media device such
    // as a camera, microphone, or speaker is connected to or removed from the system
    mediaDevices?.addEventListener('devicechange', refreshDevices);

    return () =>
      mediaDevices?.removeEventListener('devicechange', refreshDevices);
  }, [updateActiveDevice, refreshDevices]);

  return {
    permissions,
    initializeDevices,
    devices,
    activeDevices,
    updateActiveDevice
  };
};

export default useDevices;