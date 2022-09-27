import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { MODAL_TYPE, useModal } from './Modal';
import { STREAM_ACTION_NAME } from '../constants';
import { useUser } from './User';
import useContextHook from './useContextHook';
import useLocalStorage from '../hooks/useLocalStorage';

const Context = createContext(null);
Context.displayName = 'ManagerStreamActions';

const DEFAULT_STATE = {
  [STREAM_ACTION_NAME.QUIZ]: { value: '' },
  [STREAM_ACTION_NAME.PRODUCT]: {},
  [STREAM_ACTION_NAME.NOTICE]: {},
  [STREAM_ACTION_NAME.CELEBRATION]: {}
};

export const Provider = ({ children }) => {
  const { openModal } = useModal();
  const { userData } = useUser();
  const {
    value: storedStreamManagerActionData,
    set: setStoredStreamManagerActionData
  } = useLocalStorage({
    key: userData?.username,
    keyPrefix: 'user',
    initialValue: DEFAULT_STATE,
    path: ['streamActions']
  });
  const [streamManagerActionData, setStreamManagerActionData] =
    useState(DEFAULT_STATE);

  /* Initializes the local streamManagerActionData with the stored value in local storage */
  useEffect(() => {
    if (storedStreamManagerActionData) {
      setStreamManagerActionData((prevStreamManagerActionData) =>
        JSON.stringify(prevStreamManagerActionData) !==
        JSON.stringify(storedStreamManagerActionData)
          ? storedStreamManagerActionData
          : prevStreamManagerActionData
      );
    }
  }, [storedStreamManagerActionData]);

  /**
   * Gets the current form state data for the given stream action name,
   * or all the streamManagerActionData if no actionName is provided
   */
  const getStreamManagerActionData = useCallback(
    (actionName) =>
      actionName
        ? streamManagerActionData[actionName]
        : streamManagerActionData,
    [streamManagerActionData]
  );

  /**
   * Updates the current form state data for the given stream action name
   * by merging in the provided newData object
   */
  const updateStreamManagerActionData = useCallback((newData, actionName) => {
    setStreamManagerActionData((prevData) => ({
      ...prevData,
      [actionName]: {
        ...prevData[actionName],
        ...newData
      }
    }));
  }, []);

  /* Saves the form data in local storage */
  const saveStreamManagerActionData = useCallback(
    (data) => setStoredStreamManagerActionData(data),
    [setStoredStreamManagerActionData]
  );

  /* Resets the form data to the last data saved in local storage */
  const resetStreamManagerActionData = useCallback(() => {
    setStreamManagerActionData(storedStreamManagerActionData);
  }, [storedStreamManagerActionData]);

  /* Sends a timed metadata event to all stream viewers */
  const sendTimedMetadata = (actionName, data) => {
    const streamActionData = data[actionName];
    const startTime = new Date().toISOString();
    // TEMPORARY
    console.info('Timed metadata sent for', {
      actionName,
      startTime,
      streamActionData
    });
  };

  const openStreamManagerActionModal = useCallback(
    (actionName, modalData) => {
      openModal({
        onSave: saveStreamManagerActionData,
        onCancel: resetStreamManagerActionData,
        onConfirm: (data) => sendTimedMetadata(actionName, data),
        type: MODAL_TYPE.STREAM_MANAGER_ACTION,
        ...modalData
      });
    },
    [openModal, resetStreamManagerActionData, saveStreamManagerActionData]
  );

  const value = useMemo(
    () => ({
      getStreamManagerActionData,
      openStreamManagerActionModal,
      updateStreamManagerActionData
    }),
    [
      getStreamManagerActionData,
      openStreamManagerActionModal,
      updateStreamManagerActionData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
