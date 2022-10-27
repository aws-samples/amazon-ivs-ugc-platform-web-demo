import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_STREAM_MANAGER_ACTIONS_STATE } from './utils';
import { pack, unpack } from '../../utils/streamActionHelpers';
import { useChannel } from '../Channel';
import { useUser } from '../User';
import useLatest from '../../hooks/useLatest';
import useLocalStorage from '../../hooks/useLocalStorage';

const useStreamManagerActionsLocalStorage = ({
  updateStreamManagerActionData
}) => {
  const { userData } = useUser();
  const { channelData } = useChannel();
  const { isLive } = channelData || {};
  const [hasLoadedInitialStoredData, setHasLoadedInitialStoredData] =
    useState(false);
  const {
    value: storedStreamManagerActionData,
    set: setStoredStreamManagerActionData
  } = useLocalStorage({
    key: userData?.username,
    initialValue: DEFAULT_STREAM_MANAGER_ACTIONS_STATE,
    options: {
      keyPrefix: 'user',
      path: ['streamActions'],
      serialize: pack,
      deserialize: unpack
    }
  });
  const latestStoredStreamManagerActionData = useLatest(
    storedStreamManagerActionData
  );

  /**
   * Saves the form data in local storage
   */
  const saveStreamManagerActionData = useCallback(
    (dataOrFn) =>
      setStoredStreamManagerActionData((prevStoredData) => {
        const data =
          dataOrFn instanceof Function ? dataOrFn(prevStoredData) : dataOrFn;
        const shouldUpdate =
          JSON.stringify(prevStoredData) !== JSON.stringify(data);
        const dataToSave = shouldUpdate ? data : prevStoredData;
        updateStreamManagerActionData({
          dataOrFn: dataToSave,
          shouldValidate: false
        });

        return dataToSave;
      }),
    [setStoredStreamManagerActionData, updateStreamManagerActionData]
  );

  /**
   * Removes any expired stream manager action data and initializes
   * streamManagerActionData with the stored value in local storage
   */
  useEffect(() => {
    if (!storedStreamManagerActionData || hasLoadedInitialStoredData) return;

    // Remove active stream manager action data from local storage if it has expired
    saveStreamManagerActionData((prevStoredData) => {
      const { expiry } = prevStoredData?._active || {};
      const hasExpired = new Date().toISOString() > expiry;

      return hasExpired
        ? { ...prevStoredData, _active: undefined }
        : prevStoredData;
    });
    setHasLoadedInitialStoredData(true);
  }, [
    hasLoadedInitialStoredData,
    saveStreamManagerActionData,
    storedStreamManagerActionData
  ]);

  // Clears the active action when a stream goes offline
  useEffect(() => {
    const updateActiveAction = (setter) => {
      setter((prevData) => {
        const isOffline = isLive === false;

        return isOffline ? { ...prevData, _active: undefined } : prevData;
      });
    };

    if (hasLoadedInitialStoredData) {
      updateActiveAction(setStoredStreamManagerActionData);
      updateActiveAction((setFn) =>
        updateStreamManagerActionData({
          dataOrFn: setFn,
          shouldValidate: false
        })
      );
    }
  }, [
    hasLoadedInitialStoredData,
    isLive,
    setStoredStreamManagerActionData,
    updateStreamManagerActionData
  ]);

  return {
    saveStreamManagerActionData,
    latestStoredStreamManagerActionData,
    storedStreamManagerActionData
  };
};

export default useStreamManagerActionsLocalStorage;
