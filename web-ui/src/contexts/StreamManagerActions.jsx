import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { channelAPI } from '../api';
import { MODAL_TYPE, useModal } from './Modal';
import { pack, unpack } from '../utils/streamActionHelpers';
import {
  CELEBRATION_STREAM_ACTION_DURATION,
  STREAM_ACTION_NAME
} from '../constants';
import { streamManager as $content } from '../content';
import { useChannel } from './Channel';
import { useNotif } from './Notification';
import { useUser } from './User';
import useContextHook from './useContextHook';
import useLocalStorage from '../hooks/useLocalStorage';

const Context = createContext(null);
Context.displayName = 'StreamManagerActions';

const DEFAULT_STATE = {
  [STREAM_ACTION_NAME.QUIZ]: { duration: 10 },
  [STREAM_ACTION_NAME.PRODUCT]: {},
  [STREAM_ACTION_NAME.NOTICE]: {},
  [STREAM_ACTION_NAME.CELEBRATION]: {
    duration: CELEBRATION_STREAM_ACTION_DURATION
  }
};

/**
 * The StreamManagerActions context is the orchestrator of stream manager action data.
 * The Provider takes
 */
export const Provider = ({ children }) => {
  const { openModal } = useModal();
  const { userData } = useUser();
  const { channelData } = useChannel();
  const { isLive } = channelData || {};
  const { notifyError, notifySuccess } = useNotif();
  const {
    value: storedStreamManagerActionData,
    set: setStoredStreamManagerActionData
  } = useLocalStorage({
    key: userData?.username,
    initialValue: DEFAULT_STATE,
    options: {
      keyPrefix: 'user',
      path: ['streamActions'],
      serialize: pack,
      deserialize: unpack
    }
  });
  const [isSendingStreamAction, setIsSendingStreamAction] = useState(false);
  const [streamManagerActionData, setStreamManagerActionData] =
    useState(DEFAULT_STATE);
  const activeStreamManagerActionData = useMemo(
    () => streamManagerActionData?._active || null,
    [streamManagerActionData?._active]
  );

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
    setStreamManagerActionData((prevData) =>
      actionName
        ? {
            ...prevData,
            [actionName]: {
              ...prevData[actionName],
              ...newData
            }
          }
        : newData
    );
  }, []);

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
        updateStreamManagerActionData(dataToSave);

        return dataToSave;
      }),
    [setStoredStreamManagerActionData, updateStreamManagerActionData]
  );

  /**
   * Sends a timed metadata event to all stream viewers
   */
  const sendStreamAction = useCallback(
    async (actionName, data = storedStreamManagerActionData) => {
      // Send a timed metadata event
      const actionData = data[actionName];
      let result, error;
      if (isLive) {
        setIsSendingStreamAction(true);
        const metadata = pack({ data: actionData, name: actionName });
        ({ result, error } = await channelAPI.sendStreamAction(metadata));
      }

      // Save the form data, including the startTime only if the send request was successful
      const dataToSave = data;
      if (result) {
        const { duration } = actionData;
        const expiry =
          duration > 0
            ? new Date(Date.now() + duration * 1000).toISOString()
            : undefined;

        dataToSave._active = { expiry, name: actionName };
      }
      saveStreamManagerActionData(dataToSave);

      // Notify the user of the send request status
      if (error || !isLive)
        notifyError($content.notifications.error.unable_to_start_stream_action);
      else
        notifySuccess($content.notifications.success[`started_${actionName}`]);

      setIsSendingStreamAction(false);
    },
    [
      isLive,
      notifyError,
      notifySuccess,
      saveStreamManagerActionData,
      storedStreamManagerActionData
    ]
  );

  /**
   * Stops the currently active stream action, if one exists
   */
  const stopStreamAction = useCallback(async () => {
    if (!activeStreamManagerActionData) return;

    const { expiry } = activeStreamManagerActionData;
    const hasExpired = new Date().toISOString() > expiry;

    // Only send a "stop" timed metadata event if the currently active stream action
    // is being stopped before it has expired or the stream action is perpetual
    if (!expiry || !hasExpired) {
      const metadata = pack(null);
      await channelAPI.sendStreamAction(metadata);
    }

    saveStreamManagerActionData((prevStoredData) => ({
      ...prevStoredData,
      _active: undefined
    }));
  }, [activeStreamManagerActionData, saveStreamManagerActionData]);

  /**
   * Resets the form data to the last data saved in local storage
   */
  const resetStreamManagerActionData = useCallback(() => {
    setStreamManagerActionData(storedStreamManagerActionData);
  }, [storedStreamManagerActionData]);

  /**
   * Opens a Stream Manager Action modal for a specific action name,
   * with the "content" provided in the modalData argument
   */
  const openStreamManagerActionModal = useCallback(
    (actionName, modalData) => {
      const onSave = (data) => {
        saveStreamManagerActionData(data);
        notifySuccess($content.notifications.success.stream_action_saved);
      };

      const onConfirm = (data) => sendStreamAction(actionName, data);

      openModal({
        onSave,
        onConfirm,
        onCancel: resetStreamManagerActionData,
        type: MODAL_TYPE.STREAM_MANAGER_ACTION,
        ...modalData
      });
    },
    [
      notifySuccess,
      openModal,
      resetStreamManagerActionData,
      saveStreamManagerActionData,
      sendStreamAction
    ]
  );

  /**
   * Removes any expired stream manager action data and initializes
   * streamManagerActionData with the stored value in local storage
   */
  useEffect(() => {
    if (!storedStreamManagerActionData) return;

    // Remove active stream manager action data from local storage if it has expired
    const savedStreamManagerActionData = saveStreamManagerActionData(
      (prevStoredData) => {
        const { expiry } = prevStoredData._active || {};
        const hasExpired = new Date().toISOString() > expiry;
        const isOffline = isLive === false;

        return hasExpired || isOffline
          ? { ...prevStoredData, _active: undefined }
          : prevStoredData;
      }
    );

    // Update the local streamManagerActionData with the stored value in local storage
    setStreamManagerActionData((prevStreamManagerActionData) =>
      JSON.stringify(prevStreamManagerActionData) !==
      JSON.stringify(savedStreamManagerActionData)
        ? savedStreamManagerActionData
        : prevStreamManagerActionData
    );
  }, [isLive, saveStreamManagerActionData, storedStreamManagerActionData]);

  const value = useMemo(
    () => ({
      activeStreamManagerActionData,
      getStreamManagerActionData,
      isSendingStreamAction,
      openStreamManagerActionModal,
      sendStreamAction,
      stopStreamAction,
      updateStreamManagerActionData
    }),
    [
      activeStreamManagerActionData,
      getStreamManagerActionData,
      isSendingStreamAction,
      openStreamManagerActionModal,
      sendStreamAction,
      stopStreamAction,
      updateStreamManagerActionData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
