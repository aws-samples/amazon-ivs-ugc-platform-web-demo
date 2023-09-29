import { useCallback, useEffect, useRef, useState } from 'react';

import { CAMERA_LAYER_NAME } from '../useLayers';
import { getMediaDevices, requestMediaPermissions } from './utils';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../useAudioMixer';
import { streamManager as $streamManagerContent } from '../../../content';
import { noop } from '../../../utils';
import useStateWithCallback from '../../../hooks/useStateWithCallback';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const defaultPermissions = {
  audio: false,
  video: false
};

const defaultActiveDevices = {
  [CAMERA_LAYER_NAME]: undefined,
  [MICROPHONE_AUDIO_INPUT_NAME]: undefined
};

const useDevices = ({
  addMicAudioInput,
  addVideoLayer,
  removeAudioInput,
  removeLayer,
  presetLayers,
  setError,
  setSuccess
}) => {
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [devices, setDevices] = useState({
    [CAMERA_LAYER_NAME]: [],
    [MICROPHONE_AUDIO_INPUT_NAME]: []
  });
  const [activeDevices, setActiveDevices] =
    useStateWithCallback(defaultActiveDevices);
  const hasDevicesReset = useRef(false);

  const resetDevices = useCallback(() => {
    setDevices({
      [CAMERA_LAYER_NAME]: [],
      [MICROPHONE_AUDIO_INPUT_NAME]: []
    });
    setActiveDevices(defaultActiveDevices);
    hasDevicesReset.current = true;
  }, [setActiveDevices]);

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
                errorMessage = permissions.video
                  ? $content.notifications.error.failed_to_change_camera
                  : $content.notifications.error.failed_to_access_camera;
              if (deviceName === MICROPHONE_AUDIO_INPUT_NAME)
                errorMessage = permissions.audio
                  ? $content.notifications.error.failed_to_change_mic
                  : $content.notifications.error.failed_to_access_mic;
              errorMessage &&
                !hasDevicesReset.current &&
                setError({ message: errorMessage });
            }
          }
        );
      }
    },
    [
      addVideoLayer,
      addMicAudioInput,
      setActiveDevices,
      permissions,
      setError,
      hasDevicesReset
    ]
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
                if (onNewActiveDevice) onNewActiveDevice();

                let updateMessage;
                if (deviceName === CAMERA_LAYER_NAME)
                  updateMessage =
                    $content.notifications.success.camera_changed_to;
                if (deviceName === MICROPHONE_AUDIO_INPUT_NAME)
                  updateMessage = $content.notifications.success.mic_changed_to;
                updateMessage &&
                  setSuccess(`${updateMessage} ${nextActiveDevice.label}`);
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
            if (onNewActiveDevice) onNewActiveDevice();
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
          errorMessage = $content.notifications.error.failed_to_access_camera;
        if (undetectedDeviceNames[0] === MICROPHONE_AUDIO_INPUT_NAME)
          errorMessage = $content.notifications.error.failed_to_access_mic;
      } else if (undetectedDeviceNames.length === 2)
        errorMessage = $content.notifications.error.no_camera_or_mic_detected;

      if (errorMessage && permissions.video && permissions.audio) {
        setError({ message: errorMessage });
      }

      isRefreshingDevices.current = false;

      return nextDevices;
    },
    [
      activeDevices,
      permissions,
      presetLayers.noCamera,
      removeAudioInput,
      removeLayer,
      setError,
      setSuccess,
      updateActiveDevice
    ]
  );

  const initializeDevices = useCallback(async () => {
    hasDevicesReset.current = false;
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
      setActiveDevices({
        [CAMERA_LAYER_NAME]: false,
        [MICROPHONE_AUDIO_INPUT_NAME]: false
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
  }, [refreshDevices, setError, updateActiveDevice, setActiveDevices]);

  const detectDevicePermissions = useCallback(async () => {
    let _permissions = permissions;

    const onPermissionsDenied = (error) => {
      setError({
        message: $content.notifications.error.permissions_denied,
        err: error
      });
      // Reset permission and active devices states
      setPermissions(defaultPermissions);
      setActiveDevices({
        [CAMERA_LAYER_NAME]: false,
        [MICROPHONE_AUDIO_INPUT_NAME]: false
      });

      _permissions = defaultPermissions;
    };

    await requestMediaPermissions({
      onPermissionsGranted: noop,
      onPermissionsDenied
    });

    return _permissions;
  }, [permissions, setError, setActiveDevices]);

  useEffect(() => {
    const { mediaDevices } = navigator;

    // A devicechange event is sent to a MediaDevices instance whenever a media device such
    // as a camera, microphone, or speaker is connected to or removed from the system
    mediaDevices?.addEventListener('devicechange', refreshDevices);

    return () =>
      mediaDevices?.removeEventListener('devicechange', refreshDevices);
  }, [updateActiveDevice, refreshDevices]);

  useEffect(() => {
    /**
     * When an external device is disconnected, the OS may not immediately update its list of available devices.
     * This can cause Firefox to return outdated or incomplete device information, including devices with no labels.
     */
    const isDeviceLabelEmpty =
      Object.values(devices)
        .flat()
        .some((device) => device.label === '') || false;

    if (isDeviceLabelEmpty) refreshDevices();
  }, [devices, refreshDevices]);

  return {
    permissions,
    initializeDevices,
    devices,
    activeDevices,
    updateActiveDevice,
    detectDevicePermissions,
    resetDevices
  };
};

export default useDevices;
