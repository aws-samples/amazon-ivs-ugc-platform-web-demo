import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { BROADCAST_STREAM_CONFIG_PRESETS } from '../../constants';
import {
  createBackgroundLayerPreset,
  createNoCameraLayerPreset
} from './useLayers/presetLayers';
import { streamManager as $streamManagerContent } from '../../content';
import { useNotif } from '../Notification';
import useAudioMixer, { MICROPHONE_AUDIO_INPUT_NAME } from './useAudioMixer';
import useContextHook from '../useContextHook';
import useDevices from './useDevices';
import useLayers, { CAMERA_LAYER_NAME } from './useLayers';
import useMount from '../../hooks/useMount';
import useScreenShare from './useScreenShare';
import useThrottledCallback from '../../hooks/useThrottledCallback';
import { useLocation } from 'react-router-dom';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const {
  BroadcastClientEvents: {
    ACTIVE_STATE_CHANGE,
    CONNECTION_STATE_CHANGE,
    ERROR
  },
  ConnectionState,
  create,
  LOG_LEVEL
} = window.IVSBroadcastClient;

/**
 * StreamConfig {
 *  maxResolution: { width: number, height: number }; // 160-1920 (px), 1920x1080 or 1080x1920 maximums
 *  maxFramerate: number; // 10-60 (fps)
 *  maxBitrate: number; // 200-8500 (Mbps)
 * }
 * - The stream config must match IVS account config
 */
const channelType = process.env.REACT_APP_CHANNEL_TYPE;
const orientation = 'landscape';
const streamConfig = {
  ...BROADCAST_STREAM_CONFIG_PRESETS[channelType][orientation],
  maxResolution: { width: 1280, height: 720 } // max resolution override to avoid full HD performance issues
};
const logLevel = LOG_LEVEL.ERROR;
const CONNECTION_TIMEOUT = 10_000; // 10s

// Singleton IVS Web Broadcast client instance
export let client;
let isInitialized = false;

const Context = createContext(null);
Context.displayName = 'Broadcast';

export const Provider = ({
  children,
  ingestEndpoint,
  streamKey,
  previewRef
}) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const connectionTimeoutRef = useRef(null);
  const { notifyError, notifySuccess } = useNotif();
  const isMounted = useMount();

  /**
   * Layers
   */
  const {
    addVideoLayer,
    addScreenShareLayer,
    addImageLayer,
    toggleLayer,
    updateLayerGroup,
    removeLayer,
    isLayerHidden
  } = useLayers();
  const presetLayers = useMemo(() => {
    const handlers = { addImageLayer, removeLayer };

    return {
      noCamera: createNoCameraLayerPreset(handlers),
      background: createBackgroundLayerPreset(handlers)
    };
  }, [addImageLayer, removeLayer]);

  /**
   * Audio inputs
   */
  const {
    addMicAudioInput,
    addScreenShareAudioInput,
    toggleMute,
    removeAudioInput,
    isAudioInputMuted
  } = useAudioMixer();

  /**
   * Screen share
   */
  const {
    isScreenSharing,
    shouldShowCameraOnScreenShare,
    stopScreenShare,
    toggleScreenShare,
    updateShouldShowCameraOnScreenShare
  } = useScreenShare({
    addScreenShareAudioInput,
    addScreenShareLayer,
    removeAudioInput,
    removeLayer,
    updateLayerGroup,
    setError
  });

  /**
   * Devices
   */
  const {
    permissions,
    initializeDevices,
    devices,
    activeDevices,
    updateActiveDevice,
    detectDevicePermissions
  } = useDevices({
    addMicAudioInput,
    addVideoLayer,
    presetLayers,
    removeAudioInput,
    removeLayer,
    setError,
    setSuccess
  });

  const hasPermissions = permissions.audio && permissions.video;

  /**
   * Camera helpers
   */
  const isCameraHidden = isLayerHidden(CAMERA_LAYER_NAME);
  const toggleCameraThrottled = useThrottledCallback((options) => {
    const isHidden = toggleLayer(CAMERA_LAYER_NAME, options);

    if (isHidden) presetLayers.noCamera.add();
    else presetLayers.noCamera.remove();
  }, 250);

  /**
   * Microphone helpers
   */
  const isMicrophoneMuted = isAudioInputMuted(MICROPHONE_AUDIO_INPUT_NAME);
  const toggleMicrophoneThrottled = useThrottledCallback(
    (options) => toggleMute(MICROPHONE_AUDIO_INPUT_NAME, options),
    250
  );

  /**
   * Screen share helpers
   */
  const toggleScreenShareThrottled = useThrottledCallback(
    toggleScreenShare,
    250
  );

  const stopBroadcast = useCallback(() => client?.stopBroadcast(), []);

  const startBroadcast = useCallback(async () => {
    try {
      if (!streamKey)
        throw new Error(
          'Failed to start broadcast stream - missing stream key.'
        );

      /***
       * Because the streamer is able to update the permissions once the browser has prompted the first time,
       * We will need to do a final check to see if permissions are still allowed.
       * The latest permissions will be used to tell if the user can start a broadcast.
       */
      const latestPermissions = await detectDevicePermissions();

      const missingPermissions = [];
      for (const permissionType in latestPermissions) {
        const hasPermission = latestPermissions[permissionType];
        if (!hasPermission) missingPermissions.push(permissionType);
      }

      if (missingPermissions.length) {
        const missingPermissionsStr = missingPermissions.join(', ');
        throw new Error(
          `Failed to start broadcast stream due to missing required permission(s): ${missingPermissionsStr}.`
        );
      }
      connectionTimeoutRef.current = setTimeout(() => {
        stopBroadcast();
        console.error(
          "It's taking longer than usual to start broadcasting. Check the status of your internet connection and disable any active VPNs."
        );
      }, CONNECTION_TIMEOUT);

      // Eagerly set the connecting state indicator to true
      setIsConnecting(true);

      // Resume the audio context to prevent audio issues when starting
      // a broadcast stream after idling on the page in some browsers
      await client.getAudioContext().resume();
      await client.startBroadcast(streamKey, ingestEndpoint);
    } catch (error) {
      clearTimeout(connectionTimeoutRef.current);
      stopBroadcast();
      setIsConnecting(false);
      setError({
        message: $content.notifications.error.could_not_go_live,
        err: error
      });
    }
  }, [detectDevicePermissions, ingestEndpoint, stopBroadcast, streamKey]);

  const resetPreview = useCallback(() => {
    if (!client || !previewRef.current) return;
    client.detachPreview();
    client.attachPreview(previewRef.current);
  }, [previewRef]);

  // ACTIVE_STATE_CHANGE events indicate that the broadcast start/stop state has changed
  const onActiveStateChange = (activeState) => setIsBroadcasting(activeState);

  // CONNECTION_STATE_CHANGE events indicate that the WebRTC connection state has changed
  const onConnectionStateChange = (state) => {
    const { NEW, CONNECTED, CONNECTING } = ConnectionState;
    if (state === CONNECTED) clearTimeout(connectionTimeoutRef.current);
    setIsConnecting([NEW, CONNECTING].includes(state));
  };

  // ERROR events indicate that the client has encountered an error
  const onClientError = (clientError) => {
    console.error(clientError);

    if (clientError.code === 10001) {
      setError({
        message: $content.notifications.error.stream_disconnected
      });
    }
  };

  const initializeBroadcastClient = useCallback(async () => {
    // Create the IVS Web Broadcast client instance
    client = create({ streamConfig, logLevel });

    // Register the IVS broadcast client event listeners
    client.on(ACTIVE_STATE_CHANGE, onActiveStateChange);
    client.on(CONNECTION_STATE_CHANGE, onConnectionStateChange);
    client.on(ERROR, onClientError);

    // Add a background layer for permissions prompt state
    await presetLayers.background.add();

    // Attach an HTMLCanvasElement to display a preview of the output
    client.attachPreview(previewRef.current);
    setIsBroadcasting(false);
  }, [presetLayers.background, previewRef]);

  const restartBroadcastClient = useCallback(
    async (_isCameraHidden = false, _isMicrophoneMuted = false) => {
      let addDevice, options;

      await initializeBroadcastClient();

      if (_isCameraHidden) presetLayers.noCamera.add();

      // Setup video layer and audio input
      for (const deviceName in activeDevices) {
        if (deviceName === CAMERA_LAYER_NAME) {
          addDevice = addVideoLayer;
          options = {
            position: { index: 1 },
            layerGroupId: CAMERA_LAYER_NAME,
            hidden: _isCameraHidden
          };
        }
        if (deviceName === MICROPHONE_AUDIO_INPUT_NAME) {
          addDevice = addMicAudioInput;
          options = { muted: _isMicrophoneMuted };
        }
        if (addDevice) {
          const didUpdate = await addDevice(deviceName, {
            deviceId: activeDevices[deviceName]?.deviceId,
            ...options
          });

          if (!didUpdate) {
            let errorMessage;
            if (deviceName === CAMERA_LAYER_NAME)
              errorMessage =
                $content.notifications.error.failed_to_access_camera;
            if (deviceName === MICROPHONE_AUDIO_INPUT_NAME)
              errorMessage = $content.notifications.error.failed_to_access_mic;

            errorMessage && setError({ message: errorMessage });
          }
        }
      }
      isInitialized = true;
    },
    [
      initializeBroadcastClient,
      presetLayers.noCamera,
      activeDevices,
      addVideoLayer,
      addMicAudioInput
    ]
  );

  const removeBroadcastClient = useCallback(() => {
    if (!!client) {
      // Remove all input devices
      client.disableVideo();
      client.disableAudio();
      if (!!client.getVideoInputDevice(CAMERA_LAYER_NAME)) {
        client.removeVideoInputDevice(CAMERA_LAYER_NAME);
      }
      if (!!client.getAudioInputDevice(MICROPHONE_AUDIO_INPUT_NAME)) {
        client.removeAudioInputDevice(MICROPHONE_AUDIO_INPUT_NAME);
      }

      clearTimeout(connectionTimeoutRef.current);
      stopScreenShare();
      stopBroadcast(); // Stop the broadcast

      client?.off(ACTIVE_STATE_CHANGE, onActiveStateChange);
      client?.off(CONNECTION_STATE_CHANGE, onConnectionStateChange);
      client?.off(ERROR, onClientError);

      client.delete(); // Explicitly stop and/or free internal client components that would otherwise leak
      client = undefined;
      isInitialized = false;

      // Set preview canvas initial black background
      if (previewRef && previewRef.current) {
        const canvas = previewRef.current;
        const canvasContext = previewRef.current.getContext('2d');

        canvasContext.fillStyle = 'black';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [previewRef, stopBroadcast, stopScreenShare]);

  /**
   * Initialize client, request permissions and refresh devices
   */

  const { state } = useLocation();
  useEffect(() => {
    if (!isInitialized && previewRef.current) {
      initializeBroadcastClient();

      isInitialized = true;
    }

    return () => {
      if (!isMounted()) return;

      removeBroadcastClient();
    };
  }, [
    initializeBroadcastClient,
    isMounted,
    previewRef,
    removeBroadcastClient,
    state
  ]);

  useEffect(() => {
    if (error) {
      const { message, err } = error;

      if (err) console.error(err, message);

      if (message) notifyError(message, { asPortal: true });

      setError(null);
    }
  }, [error, notifyError]);

  useEffect(() => {
    if (success) {
      notifySuccess(success, { asPortal: true });

      setSuccess(null);
    }
  }, [success, notifySuccess]);

  const value = useMemo(
    () => ({
      // Devices and permissions
      devices,
      detectDevicePermissions,
      activeDevices,
      updateActiveDevice,
      permissions,
      hasPermissions,
      initializeDevices,
      // Layers
      toggleCamera: toggleCameraThrottled,
      toggleScreenShare: toggleScreenShareThrottled,
      updateShouldShowCameraOnScreenShare,
      shouldShowCameraOnScreenShare,
      isCameraHidden,
      isScreenSharing,
      presetLayers,
      // Audio inputs
      isMicrophoneMuted,
      toggleMicrophone: toggleMicrophoneThrottled,
      // Controls
      previewRef,
      startBroadcast,
      stopBroadcast,
      resetPreview,
      // Indicators
      isBroadcasting,
      isConnecting,
      error,
      // Client
      restartBroadcastClient,
      removeBroadcastClient
    }),
    [
      activeDevices,
      devices,
      detectDevicePermissions,
      error,
      hasPermissions,
      initializeDevices,
      isBroadcasting,
      isCameraHidden,
      isConnecting,
      isMicrophoneMuted,
      isScreenSharing,
      permissions,
      presetLayers,
      previewRef,
      removeBroadcastClient,
      resetPreview,
      restartBroadcastClient,
      shouldShowCameraOnScreenShare,
      startBroadcast,
      stopBroadcast,
      toggleCameraThrottled,
      toggleMicrophoneThrottled,
      toggleScreenShareThrottled,
      updateActiveDevice,
      updateShouldShowCameraOnScreenShare
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  ingestEndpoint: PropTypes.string,
  streamKey: PropTypes.string,
  previewRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

Provider.defaultProps = {
  ingestEndpoint: '',
  streamKey: ''
};

export const useBroadcast = () => useContextHook(Context);
