import { useCallback, useEffect, useRef } from 'react';
import { updateIsBlockingRoute } from '../contexts/Stage/Global/reducer/actions';

const useDevicePermissionChangeListeners = () => {
  const cameraPermissionRef = useRef();
  const microphonePermissionRef = useRef();

  const handlePermissionsRevoked = useCallback((devicePermission) => {
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
  }, []);

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
  }, [cameraAndMicrophonePermissionsChangeListener, handlePermissionsRevoked]);
};

export default useDevicePermissionChangeListeners;
