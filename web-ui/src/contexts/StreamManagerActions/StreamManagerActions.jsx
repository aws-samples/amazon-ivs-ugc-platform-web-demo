import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { channelAPI } from '../../api';
import { MODAL_TYPE, useModal } from '../Modal';
import { pack, unpack } from '../../utils/streamActionHelpers';
import {
  PRODUCT_DATA_KEYS,
  QUIZ_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../constants';
import { streamManager as $content } from '../../content';
import { useChannel } from '../Channel';
import { useNotif } from '../Notification';
import { useUser } from '../User';
import useContextHook from '../useContextHook';
import useLocalStorage from '../../hooks/useLocalStorage';
import useStreamManagerActionValidation from './useStreamManagerActionValidation';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const Context = createContext(null);
Context.displayName = 'StreamManagerActions';

const DEFAULT_STATE = {
  [STREAM_ACTION_NAME.QUIZ]: {
    [QUIZ_DATA_KEYS.QUESTION]: '',
    [QUIZ_DATA_KEYS.ANSWERS]: Array(
      STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.QUIZ][
        QUIZ_DATA_KEYS.ANSWERS
      ].min
    ).fill(''),
    [QUIZ_DATA_KEYS.CORRECT_ANSWER_INDEX]: 0,
    [QUIZ_DATA_KEYS.DURATION]: 15
  },
  [STREAM_ACTION_NAME.PRODUCT]: {
    [PRODUCT_DATA_KEYS.TITLE]: '',
    [PRODUCT_DATA_KEYS.PRICE]: '',
    [PRODUCT_DATA_KEYS.IMAGE_URL]: '',
    [PRODUCT_DATA_KEYS.DESCRIPTION]: ''
  },
  [STREAM_ACTION_NAME.NOTICE]: {},
  [STREAM_ACTION_NAME.CELEBRATION]: {
    duration:
      STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.CELEBRATION].duration
  }
};
const FIXED_NOTIF_OPTIONS = {
  className: ['fixed', 'z-[1100]']
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
  const { notifyError, notifySuccess, dismissNotif } = useNotif();
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
  const [hasLoadedInitialStoredData, setHasLoadedInitialStoredData] =
    useState(false);
  const [streamManagerActionData, setStreamManagerActionData] =
    useState(DEFAULT_STATE);
  const activeStreamManagerActionData = useMemo(
    () => streamManagerActionData?._active || null,
    [streamManagerActionData?._active]
  );
  const {
    currentStreamManagerActionErrors,
    resetStreamManagerActionErrorData,
    throttledValidateStreamManagerActionData,
    validateStreamManagerActionData
  } = useStreamManagerActionValidation();

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
  const updateStreamManagerActionData = useCallback(
    ({ newData, actionName, shouldValidate = true }) => {
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

      if (shouldValidate) {
        throttledValidateStreamManagerActionData(newData, actionName, {
          disableFormatValidation: true
        });
      }
    },
    [throttledValidateStreamManagerActionData]
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
          newData: dataToSave,
          shouldValidate: false
        });

        return dataToSave;
      }),
    [setStoredStreamManagerActionData, updateStreamManagerActionData]
  );

  /**
   * Sends a timed metadata event to all stream viewers
   */
  const sendStreamAction = useThrottledCallback(
    async (actionName, data = storedStreamManagerActionData) => {
      // Send a timed metadata event
      const actionData = data[actionName];

      setIsSendingStreamAction(true);

      const metadata = pack({ data: actionData, name: actionName });
      const { result, error } = await channelAPI.sendStreamAction(metadata);

      // Save the form data only if the send request was successful
      const dataToSave = data;
      if (result) {
        const { duration } = actionData;
        const expiry =
          duration > 0
            ? new Date(Date.now() + duration * 1000).toISOString()
            : undefined;

        dataToSave._active = { duration, expiry, name: actionName };
      }
      saveStreamManagerActionData(dataToSave);

      // Notify the user of the send request status
      if (error)
        notifyError(
          $content.notifications.error.unable_to_start_stream_action,
          FIXED_NOTIF_OPTIONS
        );
      else {
        notifySuccess($content.notifications.success[`started_${actionName}`]);
      }

      setIsSendingStreamAction(false);

      return result;
    },
    100,
    [
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
        if (!validateStreamManagerActionData(data[actionName], actionName)) {
          notifyError(
            $content.notifications.error.unable_to_save,
            FIXED_NOTIF_OPTIONS
          );
        } else {
          resetStreamManagerActionErrorData();
          saveStreamManagerActionData(data);
          notifySuccess(
            $content.notifications.success.stream_action_saved,
            FIXED_NOTIF_OPTIONS
          );
        }
      };

      const onConfirm = async (data) => {
        if (!validateStreamManagerActionData(data[actionName], actionName)) {
          notifyError(
            $content.notifications.error.unable_to_send,
            FIXED_NOTIF_OPTIONS
          );

          return false;
        }

        resetStreamManagerActionErrorData();

        const result = await sendStreamAction(actionName, data);

        return !!result;
      };

      const onCancel = () => {
        dismissNotif();
        resetStreamManagerActionData();
        resetStreamManagerActionErrorData();
      };

      openModal({
        onSave,
        onConfirm,
        onCancel,
        type: MODAL_TYPE.STREAM_MANAGER_ACTION,
        ...modalData
      });
    },
    [
      dismissNotif,
      notifyError,
      notifySuccess,
      openModal,
      resetStreamManagerActionData,
      resetStreamManagerActionErrorData,
      saveStreamManagerActionData,
      sendStreamAction,
      validateStreamManagerActionData
    ]
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
      updateActiveAction(setStreamManagerActionData);
    }
  }, [hasLoadedInitialStoredData, isLive, setStoredStreamManagerActionData]);

  const value = useMemo(
    () => ({
      activeStreamManagerActionData,
      currentStreamManagerActionErrors,
      getStreamManagerActionData,
      isSendingStreamAction,
      openStreamManagerActionModal,
      sendStreamAction,
      stopStreamAction,
      updateStreamManagerActionData,
      validateStreamManagerActionData,
      throttledValidateStreamManagerActionData
    }),
    [
      activeStreamManagerActionData,
      currentStreamManagerActionErrors,
      getStreamManagerActionData,
      isSendingStreamAction,
      openStreamManagerActionModal,
      sendStreamAction,
      stopStreamAction,
      updateStreamManagerActionData,
      validateStreamManagerActionData,
      throttledValidateStreamManagerActionData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
