import { useLocalStorage } from '../StageManager/hooks';
import { debounce, noop } from './utils';
import { useCallback, useEffect, useState } from 'react';
import { enumerateDevices, requestUserMediaPermissions } from './helpers';
import { DEVICE_KIND } from './constants';
import { VIDEO_LAYER_NAME } from '../Broadcast/useLayers';
import { AUDIO_INPUT_NAME } from '../Broadcast/useAudioMixer';
import { streamManager as $streamManagerContent } from '../../content';
import { requestMediaPermissions } from '../Broadcast/useDevices/utils';
import useStateWithCallback from '../../hooks/useStateWithCallback';

const { mediaDevices } = navigator;

const defaultPermissions = {
  audio: false,
  video: false
};

const $content = $streamManagerContent.stream_manager_web_broadcast;

/**
 * Manages the devices connected to the local machine
 */
function useLocalDevices({
  toggleAudio,
  toggleVideo,
  addVideoLayer,
  addMicAudioInput,
  presetLayers,
  removeLayer,
  removeAudioInput
}) {
  const [devices, setDevices] = useState({});
  const [activeDevices, setActiveDevices] = useStateWithCallback({});
  const [userMediaError, setUserMediaError] = useState();
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [devicePreferences] = useLocalStorage('devices');

  const updateActiveDevice = useCallback(
    (deviceKind, device, options) => {
      let addDevice;
      if (deviceKind === VIDEO_LAYER_NAME) {
        addDevice = addVideoLayer;
        options = {
          position: { index: 1 },
          layerGroupId: VIDEO_LAYER_NAME,
          ...options
        };
      }
      if (deviceKind === AUDIO_INPUT_NAME) {
        addDevice = addMicAudioInput;
      }
      if (addDevice) {
        setActiveDevices(
          (prevActiveDevices) => {
            const prevActiveDevice = prevActiveDevices[deviceKind];
            const didActiveDeviceChange =
              prevActiveDevice?.deviceId !== device?.deviceId;

            return didActiveDeviceChange
              ? { ...prevActiveDevices, [deviceKind]: device }
              : prevActiveDevices;
          },
          async (prevActiveDevices) => {
            if (!device) return;

            const didUpdate = await addDevice(deviceKind, {
              deviceId: device.deviceId,
              ...options
            });

            if (!didUpdate) {
              /*
              If the device update failed, then switch back to the previously
              selected active device and display an error notification
              */
              setActiveDevices((prev) => ({
                ...prev,
                [deviceKind]: prevActiveDevices[deviceKind]
              }));

              let errorMessage;
              if (deviceKind === VIDEO_LAYER_NAME)
                errorMessage = permissions.video
                  ? $content.notifications.error.failed_to_change_camera
                  : $content.notifications.error.failed_to_access_camera;
              if (deviceKind === AUDIO_INPUT_NAME)
                errorMessage = permissions.audio
                  ? $content.notifications.error.failed_to_change_mic
                  : $content.notifications.error.failed_to_access_mic;
              console.error(errorMessage);
              // errorMessage &&
              // !hasDevicesReset.current &&
              // setError({ message: errorMessage });
            }
          }
        );
      }
    },
    [
      addVideoLayer,
      addMicAudioInput,
      setActiveDevices,
      permissions.video,
      permissions.audio
    ]
  );

  const refreshDevices = useCallback(
    async (event) => {
      const isDeviceChangeEvent = event?.type === 'devicechange';
      const nextDevices = await enumerateDevices();

      setDevices((prevDevices) => {
        if (!isDeviceChangeEvent) {
          return nextDevices;
        }

        const deviceMap = {
          [VIDEO_LAYER_NAME]: {
            newActiveDeviceOptions: { hidden: true },
            onNewActiveDevice: () => presetLayers.noCamera.add(),
            removeActiveDevice: () => removeLayer(VIDEO_LAYER_NAME)
          },
          [AUDIO_INPUT_NAME]: {
            newActiveDeviceOptions: { muted: true },
            removeActiveDevice: () => removeAudioInput(AUDIO_INPUT_NAME)
          }
        };

        // A video or audio device was either connected or disconnected
        Object.values(DEVICE_KIND).forEach((deviceKind) => {
          const activeDevice = activeDevices[deviceKind];
          const prevDevicesList = prevDevices[deviceKind] || [];
          const nextDevicesList = nextDevices[deviceKind] || [];
          const { newActiveDeviceOptions, onNewActiveDevice } =
            deviceMap[deviceKind];

          if (prevDevicesList.length > nextDevicesList.length) {
            // Device was disconnected
            const [disconnectedDevice] = prevDevicesList.filter(
              (prevDevice) =>
                nextDevicesList.findIndex(
                  (nextDevice) => prevDevice.deviceId === nextDevice.deviceId
                ) === -1
            );

            if (disconnectedDevice.deviceId === activeDevice?.deviceId) {
              // Disconnected device was active -> switch to the next device in the list
              const nextActiveDevice =
                nextDevicesList.find(
                  ({ deviceId }) => deviceId === 'default'
                ) || nextDevicesList[0];

              // Before switching to the next active device, mute/hide the current state.
              // This also ensures that we reach a sensible state even if there is no nextActiveDevice.
              if (deviceKind === DEVICE_KIND.AUDIO) {
                toggleAudio({ muted: true });
              } else if (deviceKind === DEVICE_KIND.VIDEO) {
                toggleVideo({ stopped: true });
              }

              updateActiveDevice(
                deviceKind,
                nextActiveDevice,
                newActiveDeviceOptions
              );
              if (onNewActiveDevice) onNewActiveDevice();
            }
          } else if (prevDevicesList.length < nextDevicesList.length) {
            // New device was connected.
            const [connectedDevice] = nextDevicesList.filter(
              (nextDevice) =>
                prevDevicesList.findIndex(
                  (prevDevice) => prevDevice.deviceId === nextDevice.deviceId
                ) === -1
            );

            updateActiveDevice(
              deviceKind,
              connectedDevice,
              newActiveDeviceOptions
            );
            if (onNewActiveDevice) onNewActiveDevice();
          }
        });

        return nextDevices;
      });

      return nextDevices;
    },
    [
      activeDevices,
      presetLayers.noCamera,
      removeAudioInput,
      removeLayer,
      toggleAudio,
      toggleVideo,
      updateActiveDevice
    ]
  );

  const startLocalDevices = useCallback(async () => {
    let initialDevices = {};
    let grantedDevices;

    async function onPermissionsGranted(mediaStream) {
      setUserMediaError(undefined);
      initialDevices = await refreshDevices();
      setPermissions({ audio: true, video: true });

      const grantedTracks = mediaStream?.getTracks() || [];
      grantedDevices = grantedTracks.reduce(
        (acc, { label, kind }) => ({ ...acc, [kind]: label }),
        {}
      );
    }

    function onPermissionsDenied() {
      setUserMediaError('permissionsDenied');
      setPermissions(defaultPermissions);
    }

    await requestUserMediaPermissions({
      onPermissionsGranted,
      onPermissionsDenied,
      deviceIds: devicePreferences?.deviceIds
    });

    const initialActiveDevices = Object.entries(initialDevices).reduce(
      (acc, [deviceKind, devicesList]) => {
        const grantedDeviceLabel = grantedDevices[deviceKind];
        const storedDeviceId = devicePreferences?.deviceIds?.[deviceKind];
        const initialActiveDevice =
          devicesList.find(({ label }) => label === grantedDeviceLabel) || // 1. Specific device for which permissions were granted (Firefox only)
          devicesList.find(({ deviceId }) => deviceId === storedDeviceId) || // 2. Device stored in local storage as a user preference
          devicesList.find(({ deviceId }) => deviceId === 'default') || // 3. Default device in the list
          devicesList[0]; // 4. First device in the list

        if (initialActiveDevice) {
          updateActiveDevice(deviceKind, initialActiveDevice);
        }

        return { ...acc, [deviceKind]: initialActiveDevice };
      },
      {}
    );

    return initialActiveDevices;
  }, [refreshDevices, devicePreferences?.deviceIds, updateActiveDevice]);

  const detectDevicePermissions = useCallback(async () => {
    let _permissions = permissions;

    const onPermissionsDenied = (error) => {
      setActiveDevices({
        [VIDEO_LAYER_NAME]: false,
        [AUDIO_INPUT_NAME]: false
      });

      _permissions = defaultPermissions;
    };

    await requestMediaPermissions({
      onPermissionsGranted: noop,
      onPermissionsDenied
    });

    return _permissions;
  }, [permissions, setActiveDevices]);

  useEffect(() => {
    // mediaDevices is available only in secure contexts
    if (!mediaDevices) {
      return;
    }

    /**
     * A devicechange event is sent to a MediaDevices instance whenever a media device such
     * as a camera, microphone, or speaker is connected to or removed from the system
     */
    const debouncedRefreshDevices = debounce(refreshDevices, 1200);
    mediaDevices.addEventListener('devicechange', debouncedRefreshDevices);

    return () => {
      mediaDevices.removeEventListener('devicechange', debouncedRefreshDevices);
      debouncedRefreshDevices.cancel();
    };
  }, [refreshDevices]);

  return {
    devices,
    activeDevices,
    userMediaError,
    startLocalDevices,
    updateActiveDevice,
    permissions,
    detectDevicePermissions
  };
}

export default useLocalDevices;
