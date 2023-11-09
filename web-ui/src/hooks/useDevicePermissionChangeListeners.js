import { useCallback, useEffect, useRef } from 'react';
import { updateIsBlockingRoute } from '../contexts/Stage/Global/reducer/actions';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useGlobalStage } from '../contexts/Stage';
import { useBroadcast } from '../contexts/Broadcast';
import { JOIN_PARTICIPANT_URL_PARAM_KEY } from '../helpers/stagesHelpers';

const useDevicePermissionChangeListeners = () => {
  const cameraPermissionRef = useRef();
  const microphonePermissionRef = useRef();
  const { state } = useLocation();
  const { isJoiningStageByRequest, isJoiningStageByInvite } = useGlobalStage();
  const { detectDevicePermissions } = useBroadcast();

  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);

  const handlePermissionsRevoked = useCallback(
    (devicePermission) => {
      const {
        currentTarget: { state }
      } = devicePermission;

      if (state === 'denied') {
        // Remove event listeners for permission changes.
        cameraPermissionRef.current.removeEventListener(
          'change',
          handlePermissionsRevoked
        );
        microphonePermissionRef.current.removeEventListener(
          'change',
          handlePermissionsRevoked
        );

        updateIsBlockingRoute(false);

        if (isJoiningStageByRequest || isJoiningStageByInvite) {
          // Responsible for showing a notification + disabling join button
          if (detectDevicePermissions) detectDevicePermissions();
        } else {
          setTimeout(() => {
            window.history.pushState(
              {
                isWebBroadcastContainerOpen: true
              },
              ''
            );
            window.location.href = '/manager';
          });
        }
      }
    },
    [detectDevicePermissions, isJoiningStageByInvite, isJoiningStageByRequest]
  );

  const cameraAndMicrophonePermissionsChangeListener = useCallback(async () => {
    // Request camera and microphone permission
    cameraPermissionRef.current = await navigator.permissions.query({
      name: 'camera'
    });
    microphonePermissionRef.current = await navigator.permissions.query({
      name: 'microphone'
    });

    // Listen for changes in permission status
    cameraPermissionRef.current.addEventListener(
      'change',
      handlePermissionsRevoked
    );
    microphonePermissionRef.current.addEventListener(
      'change',
      handlePermissionsRevoked
    );
  }, [handlePermissionsRevoked]);

  useEffect(() => {
    // Check for browser support
    if (!navigator.permissions || !navigator.permissions.query) {
      console.error('Permissions API not supported in this browser');
      return;
    }

    // Do not attach event listeners if reducer states have not been updated
    if (state?.isJoiningStageByRequest && !isJoiningStageByRequest) return;
    if (stageIdUrlParam && !isJoiningStageByInvite) return;

    cameraAndMicrophonePermissionsChangeListener();

    return () => {
      if (cameraPermissionRef?.current && microphonePermissionRef?.current) {
        cameraPermissionRef.current?.removeEventListener(
          'change',
          handlePermissionsRevoked
        );
        microphonePermissionRef.current?.removeEventListener(
          'change',
          handlePermissionsRevoked
        );
      }
    };
  }, [
    cameraAndMicrophonePermissionsChangeListener,
    handlePermissionsRevoked,
    isJoiningStageByInvite,
    isJoiningStageByRequest,
    stageIdUrlParam,
    state?.isJoiningStageByRequest
  ]);
};

export default useDevicePermissionChangeListeners;
