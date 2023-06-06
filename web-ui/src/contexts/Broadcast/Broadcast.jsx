import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, BROADCAST_STREAM_CONFIG_PRESETS } from '../../constants';
import {
  createBackgroundLayerPreset,
  createNoCameraLayerPreset
} from './useLayers/presetLayers';
import { streamManager as $streamManagerContent } from '../../content';
import { useModal } from '../Modal';
import { useNotif } from '../Notification';
import useAudioMixer, { MICROPHONE_AUDIO_INPUT_NAME } from './useAudioMixer';
import useContextHook from '../useContextHook';
import useDevices from './useDevices';
import useLayers, { CAMERA_LAYER_NAME } from './useLayers';
import useMount from '../../hooks/useMount';
import usePrompt from '../../hooks/usePrompt';
import useScreenShare from './useScreenShare';
import useThrottledCallback from '../../hooks/useThrottledCallback';
import { useResponsiveDevice } from '../ResponsiveDevice';

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
  const { currentBreakpoint } = useResponsiveDevice();
  const isMobile = currentBreakpoint < BREAKPOINTS.sm;
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const connectionTimeoutRef = useRef(null);

  const { openModal } = useModal();
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
    clearLayers,
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
    clearAudioInputs,
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
  ); // throttled version of toggleScreenShare

  const { isBlocked, onCancel, onConfirm } = usePrompt(isBroadcasting);

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

  /**
   * Initialize client, request permissions and refresh devices
   */
  useEffect(() => {
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

    if (!isInitialized && previewRef.current) {
      (async function init() {
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
      })();

      isInitialized = true;
    }

    return () => {
      if (!isMounted()) return;

      clearTimeout(connectionTimeoutRef.current);
      stopScreenShare();
      stopBroadcast(); // Stop the broadcast
      clearLayers(); // Remove all video layers and resets state map
      clearAudioInputs(); // Remove all audio inputs and resets state map

      client?.off(ACTIVE_STATE_CHANGE, onActiveStateChange);
      client?.off(CONNECTION_STATE_CHANGE, onConnectionStateChange);
      client?.off(ERROR, onClientError);
      client?.delete(); // Explicitly stop and/or free internal client components that would otherwise leak
      client = undefined;
      isInitialized = false;
    };
  }, [
    clearAudioInputs,
    clearLayers,
    isMounted,
    presetLayers.background,
    previewRef,
    stopBroadcast,
    stopScreenShare
  ]);

  useEffect(() => {
    if (error) {
      const { message, err } = error;

      if (err) console.error(...[err, message].filter((data) => !!data));

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

  useEffect(() => {
    if (isBlocked && isBroadcasting) {
      openModal({
        content: {
          confirmText: $content.leave_page,
          isDestructive: true,
          message: (
            <p>
              {$content.confirm_leave_page_L1}
              {isMobile ? ' ' : <br />}
              {$content.confirm_leave_page_L2}
            </p>
          )
        },
        onConfirm,
        onCancel
      });
    }
  }, [isBlocked, onCancel, onConfirm, openModal, isMobile, isBroadcasting]);

  const value = useMemo(
    () => ({
      // Devices and permissions
      devices,
      activeDevices,
      updateActiveDevice,
      permissions,
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
      startBroadcast,
      stopBroadcast,
      resetPreview,
      // Indicators
      isBroadcasting,
      isConnecting,
      error
    }),
    [
      activeDevices,
      error,
      devices,
      initializeDevices,
      isBroadcasting,
      isCameraHidden,
      isConnecting,
      isMicrophoneMuted,
      isScreenSharing,
      permissions,
      presetLayers,
      resetPreview,
      updateShouldShowCameraOnScreenShare,
      shouldShowCameraOnScreenShare,
      startBroadcast,
      stopBroadcast,
      toggleCameraThrottled,
      toggleMicrophoneThrottled,
      toggleScreenShareThrottled,
      updateActiveDevice
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
