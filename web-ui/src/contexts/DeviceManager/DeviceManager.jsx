import { useContextHook } from './hooks';
import { createContext, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import useDisplayMedia from './useDisplayMedia';
import useUserMedia from './useUserMedia';
import { Outlet } from 'react-router-dom';

const Context = createContext(null);
Context.displayName = 'DeviceManager';

function useDeviceManager() {
  return useContextHook(Context);
}

function DeviceManagerProvider({ children = null }) {
  const userMedia = useUserMedia();
  const displayMedia = useDisplayMedia();

  const { stopUserMedia } = userMedia;
  const { stopScreenShare } = displayMedia;
  const stopDevices = useCallback(() => {
    stopUserMedia();
    stopScreenShare();
  }, [stopUserMedia, stopScreenShare]);

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
