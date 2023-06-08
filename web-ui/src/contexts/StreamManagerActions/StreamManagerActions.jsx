import { createContext, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { channelAPI } from '../../api';
import { DEFAULT_STREAM_MANAGER_ACTIONS_STATE } from './utils';
import { MODAL_TYPE, useModal } from '../Modal';
import { pack } from '../../helpers/streamActionHelpers';
import {
  STREAM_ACTION_NAME,
  LOCALSTORAGE_ENABLED_STREAM_ACTIONS
} from '../../constants';
import { streamManager as $content } from '../../content';
import { useNotif } from '../Notification';
import useContextHook from '../useContextHook';
import useStreamManagerActionsLocalStorage from './useStreamManagerActionsLocalStorage';
import useStreamManagerActionValidation from './useStreamManagerActionValidation';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const Context = createContext(null);
Context.displayName = 'StreamManagerActions';

/**
 * The StreamManagerActions context is the orchestrator of stream manager action data.
 * The Provider takes
 */
export const Provider = ({ children }) => {
  const [isSendingStreamAction, setIsSendingStreamAction] = useState(false);
  const [streamManagerActionData, setStreamManagerActionData] = useState(
    DEFAULT_STREAM_MANAGER_ACTIONS_STATE
  );
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

  const { openModal } = useModal();
  const { notifyError, notifySuccess, dismissNotif } = useNotif();
  const notifySuccessPortal = useCallback(
    (msg) => notifySuccess(msg, { asPortal: true }),
    [notifySuccess]
  );
  const notifyErrorPortal = useCallback(
    (msg) => notifyError(msg, { asPortal: true }),
    [notifyError]
  );

  /**
   * Updates the current form state data for the given stream action name
   * by merging in the provided dataOrFn object/function
   */
  const updateStreamManagerActionData = useCallback(
    ({ dataOrFn, actionName, shouldValidate = true }) => {
      let newData;
      setStreamManagerActionData((prevData) => {
        newData = dataOrFn instanceof Function ? dataOrFn(prevData) : dataOrFn;
        return actionName
          ? {
              ...prevData,
              [actionName]: { ...prevData[actionName], ...newData }
            }
          : newData;
      });

      if (shouldValidate && newData) {
        throttledValidateStreamManagerActionData(newData, actionName, {
          disableFormatValidation: true
        });
      }
    },
    [throttledValidateStreamManagerActionData]
  );

  const {
    latestStoredStreamManagerActionData,
    saveStreamManagerActionData,
    storedStreamManagerActionData
  } = useStreamManagerActionsLocalStorage({
    updateStreamManagerActionData
  });

  const shouldEnableLocalStorage = (actionName) =>
    LOCALSTORAGE_ENABLED_STREAM_ACTIONS.includes(actionName);

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
   * Amazon Products
   */
  const [isLoadingNextPageOfProducts, setIsLoadingNextPageOfProducts] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidKeyword, setIsValidKeyword] = useState(false);

  /**
   * Sends a timed metadata event to all stream viewers
   */
  const sendStreamAction = useThrottledCallback(
    async (
      actionName,
      data = storedStreamManagerActionData,
      hasModalSource = true
    ) => {
      // Send a timed metadata event
      setIsSendingStreamAction(true);
      const actionData =
        actionName === STREAM_ACTION_NAME.AMAZON_PRODUCT
          ? data[actionName].productChoice
          : data[actionName];
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

      if (shouldEnableLocalStorage(actionName)) {
        saveStreamManagerActionData(dataToSave);
      }

      // Notify the user of the send request status
      if (error) {
        const notifySendError = hasModalSource
          ? notifyErrorPortal
          : notifyError;
        notifySendError(
          $content.notifications.error.unable_to_start_stream_action
        );
      } else {
        notifySuccess($content.notifications.success[`started_${actionName}`]);
      }

      setIsSendingStreamAction(false);

      return result;
    },
    100
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
    updateStreamManagerActionData({
      dataOrFn: latestStoredStreamManagerActionData.current,
      shouldValidate: false
    });
  }, [latestStoredStreamManagerActionData, updateStreamManagerActionData]);

  /**
   * Resets the Amazon product data
   */
  const handleResetAmazonProductData = useCallback(() => {
    updateStreamManagerActionData({
      dataOrFn:
        DEFAULT_STREAM_MANAGER_ACTIONS_STATE[STREAM_ACTION_NAME.AMAZON_PRODUCT],
      actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT,
      shouldValidate: false
    });
  }, [updateStreamManagerActionData]);

  /**
   * Opens a Stream Manager Action modal for a specific action name,
   * with the "content" provided in the modalData argument
   */
  const openStreamManagerActionModal = useCallback(
    (actionName, modalData) => {
      const onSave = (data) => {
        if (!validateStreamManagerActionData(data[actionName], actionName)) {
          notifyErrorPortal($content.notifications.error.unable_to_save);
        } else {
          resetStreamManagerActionErrorData();
          saveStreamManagerActionData(data);
          notifySuccessPortal(
            $content.notifications.success.stream_action_saved
          );
        }
      };

      const onConfirm = async (data) => {
        if (!validateStreamManagerActionData(data[actionName], actionName)) {
          notifyErrorPortal($content.notifications.error.unable_to_send);

          return false;
        }

        resetStreamManagerActionErrorData();

        const result = await sendStreamAction(actionName, data);

        return !!result;
      };

      const onCancel = () => {
        dismissNotif();
        if (shouldEnableLocalStorage(actionName)) {
          resetStreamManagerActionData();
        }
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
      notifyErrorPortal,
      notifySuccessPortal,
      openModal,
      resetStreamManagerActionData,
      resetStreamManagerActionErrorData,
      saveStreamManagerActionData,
      sendStreamAction,
      validateStreamManagerActionData
    ]
  );

  const value = useMemo(
    () => ({
      activeStreamManagerActionData,
      currentStreamManagerActionErrors,
      getStreamManagerActionData,
      handleResetAmazonProductData,
      isLoadingNextPageOfProducts,
      isSendingStreamAction,
      openStreamManagerActionModal,
      sendStreamAction,
      setIsLoadingNextPageOfProducts,
      stopStreamAction,
      throttledValidateStreamManagerActionData,
      updateStreamManagerActionData,
      validateStreamManagerActionData,
      isLoading,
      setIsLoading,
      isValidKeyword,
      setIsValidKeyword
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
      throttledValidateStreamManagerActionData,
      isLoadingNextPageOfProducts,
      setIsLoadingNextPageOfProducts,
      handleResetAmazonProductData,
      isValidKeyword,
      setIsValidKeyword,
      isLoading,
      setIsLoading
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
