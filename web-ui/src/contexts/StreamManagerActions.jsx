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
import { useNotif } from './Notification';
import { useUser } from './User';
import useContextHook from './useContextHook';
import useLocalStorage from '../hooks/useLocalStorage';

const Context = createContext(null);
Context.displayName = 'StreamManagerActions';

const DEFAULT_STATE = {
  [STREAM_ACTION_NAME.QUIZ]: {},
  [STREAM_ACTION_NAME.PRODUCT]: {},
  [STREAM_ACTION_NAME.NOTICE]: {},
  [STREAM_ACTION_NAME.CELEBRATION]: {
    duration: CELEBRATION_STREAM_ACTION_DURATION
  }
};

export const Provider = ({ children }) => {
  const { openModal } = useModal();
  const { userData } = useUser();
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
    (data, didSendStreamAction = false) => {
      const shouldSave =
        JSON.stringify(data) !== JSON.stringify(storedStreamManagerActionData);

      if (shouldSave) setStoredStreamManagerActionData(data);

      if (!didSendStreamAction) {
        notifySuccess($content.notifications.success.stream_action_saved);
      }
    },
    [
      notifySuccess,
      setStoredStreamManagerActionData,
      storedStreamManagerActionData
    ]
  );

  /* Resets the form data to the last data saved in local storage */
  const resetStreamManagerActionData = useCallback(() => {
    setStreamManagerActionData(storedStreamManagerActionData);
  }, [storedStreamManagerActionData]);

  /* Sends a timed metadata event to all stream viewers */
  const sendStreamAction = useCallback(
    async (actionName, data = storedStreamManagerActionData) => {
      const metadata = pack({ data: data[actionName], name: actionName });
      const { result, error } = await channelAPI.sendStreamAction(metadata);

      if (result)
        notifySuccess($content.notifications.success[`started_${actionName}`]);
      if (error)
        notifyError($content.notifications.error.unable_to_start_stream_action);
    },
    [notifyError, notifySuccess, storedStreamManagerActionData]
  );

  const openStreamManagerActionModal = useCallback(
    (actionName, modalData) => {
      openModal({
        onSave: saveStreamManagerActionData,
        onCancel: resetStreamManagerActionData,
        onConfirm: (data) => sendStreamAction(actionName, data),
        type: MODAL_TYPE.STREAM_MANAGER_ACTION,
        ...modalData
      });
    },
    [
      openModal,
      resetStreamManagerActionData,
      saveStreamManagerActionData,
      sendStreamAction
    ]
  );

  const value = useMemo(
    () => ({
      getStreamManagerActionData,
      openStreamManagerActionModal,
      sendStreamAction,
      updateStreamManagerActionData
    }),
    [
      getStreamManagerActionData,
      openStreamManagerActionModal,
      sendStreamAction,
      updateStreamManagerActionData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
