import { useCallback, useEffect, useRef } from 'react';
import { updateIsBlockingRoute } from '../contexts/Stage/Global/reducer/actions';
import { useSearchParams } from 'react-router-dom';
import { useBroadcast } from '../contexts/Broadcast';
import { USER_STAGE_ID_URL_PARAM } from '../helpers/stagesHelpers';
import { useStageManager } from '../contexts/StageManager';

const useDevicePermissionChangeListeners = () => {
  const cameraPermissionRef = useRef();
  const microphonePermissionRef = useRef();
  const { participantRole } = useStageManager() || {};
  const isInvitedStageUser = participantRole === 'invited';
  const isRequestedStageUser = participantRole === 'requested';

  const { detectDevicePermissions } = useBroadcast();

  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(USER_STAGE_ID_URL_PARAM);

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

        const isJoiningStageByModal =
          isInvitedStageUser || isRequestedStageUser;

        if (isJoiningStageByModal) {
          // Responsible for showing a notification + disabling join button
          detectDevicePermissions();
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
    [detectDevicePermissions, isInvitedStageUser, isRequestedStageUser]
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
    if (isInvitedStageUser || isRequestedStageUser) return;

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
    isInvitedStageUser,
    isRequestedStageUser,
    stageIdUrlParam
  ]);
};

export default useDevicePermissionChangeListeners;
