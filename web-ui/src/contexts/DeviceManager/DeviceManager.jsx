import { createContext, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { Outlet } from 'react-router-dom';
import { STREAM_MODES } from '../../reducers/streamManager';
import { useContextHook } from './hooks';
import useDisplayMedia from './useDisplayMedia';
import useUserMedia from './useUserMedia';

const Context = createContext(null);
Context.displayName = 'DeviceManager';

function useDeviceManager() {
  return useContextHook(Context);
}

function DeviceManagerProvider({ children = null }) {
  const {
    streamMode,
    displayMedia: { isScreenSharing }
  } = useSelector((state) => state.streamManager);
  const userMedia = useUserMedia();
  const displayMedia = useDisplayMedia();

  const { stopUserMedia } = userMedia;
  const { startScreenShare, stopScreenShare } = displayMedia;
  const stopDevices = useCallback(() => {
    stopUserMedia();
    stopScreenShare();
  }, [stopUserMedia, stopScreenShare]);

  /**
   * Screen Sharing State Management
   *
   * The "isScreenSharing" state in the shared Redux store controls the start and stop of screen sharing for real-time streaming. It's crucial to ensure this state updates only once when starting and stopping a screen share stream.
   * This precise control prevents unintended multiple starts or stops of screen sharing.
   *
   * Note: Currently, low-latency streaming does not use this state. Future refactoring may
   * unify the screen sharing logic across both real-time and low-latency streaming.
   */
  useEffect(() => {
    if (streamMode !== STREAM_MODES.REAL_TIME) return;

    if (isScreenSharing) {
      startScreenShare();
    } else {
      stopScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare, streamMode]);

  const value = useMemo(
    () => ({ userMedia, displayMedia, stopDevices }),
    [userMedia, displayMedia, stopDevices]
  );

  return (
    <Context.Provider value={value}>{children || <Outlet />}</Context.Provider>
  );
}

DeviceManagerProvider.propTypes = {
  children: PropTypes.node
};

export { DeviceManagerProvider, useDeviceManager };
