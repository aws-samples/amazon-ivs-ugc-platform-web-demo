import { createContext, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { channelAPI } from '../../api';
import { DEFAULT_STREAM_MANAGER_ACTIONS_STATE } from './utils';
import { MODAL_TYPE, useModal } from '../Modal';
import { pack } from '../../helpers/streamActionHelpers';
import {
  STREAM_ACTION_NAME,
  LOCALSTORAGE_ENABLED_STREAM_ACTIONS,
  NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS
} from '../../constants';
import { streamManager as $content } from '../../content';
import { useChat } from '../Chat';
import { useNotif } from '../Notification';
import useContextHook from '../useContextHook';
import useStreamManagerActionsLocalStorage from './useStreamManagerActionsLocalStorage';
import useStreamManagerActionValidation from './useStreamManagerActionValidation';
import useThrottledCallback from '../../hooks/useThrottledCallback';
import { v4 as uuidv4 } from 'uuid';
import { usePoll } from './Poll';
import { useUser } from '../User';

const Context = createContext(null);
Context.displayName = 'StreamManagerActions';

/**
 * The StreamManagerActions context is the orchestrator of stream manager action data.
 * The Provider takes
 */
export const Provider = ({ children }) => {
  const {
    isActive: isPollActive,
    stopPollTimerRef,
    pollHasEnded,
    updateSavedPollPropsOnTimerExpiry
  } = usePoll();
  const { startPoll, endPoll } = useChat();
  const { userData } = useUser();
  const [isSendingStreamAction, setIsSendingStreamAction] = useState(false);

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

  const [streamManagerActionData, setStreamManagerActionData] = useState(
    DEFAULT_STREAM_MANAGER_ACTIONS_STATE
  );

  const activeStreamManagerActionData = useMemo(() => {
    return streamManagerActionData?._active || null;
  }, [streamManagerActionData?._active]);

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

        // End active poll stream action
        if (isPollActive) cancelActivePoll();
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
   * Stops the currently active poll action
   */
  const endPollOnExpiry = useCallback(() => {
    pollHasEnded();
    updateSavedPollPropsOnTimerExpiry();
    stopPollTimerRef.current = setTimeout(() => {
      endPoll();
      saveStreamManagerActionData((prevStoredData) => ({
        ...prevStoredData,
        _active: undefined
      }));
    }, NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS);
  }, [
    endPoll,
    pollHasEnded,
    saveStreamManagerActionData,
    stopPollTimerRef,
    updateSavedPollPropsOnTimerExpiry
  ]);

  const cancelActivePoll = useCallback(async () => {
    await endPoll();
  }, [endPoll]);

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
    if (!shouldEnableLocalStorage(activeStreamManagerActionData?.name)) {
      return;
    }

    updateStreamManagerActionData({
      dataOrFn: latestStoredStreamManagerActionData.current,
      shouldValidate: false
    });
  }, [
    activeStreamManagerActionData?.name,
    latestStoredStreamManagerActionData,
    updateStreamManagerActionData
  ]);

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
   *  Start Poll stream action
   */

  const sendPollStreamAction = useThrottledCallback(
    async (actionName, data) => {
      // End active stream actions
      if (
        activeStreamManagerActionData &&
        actionName !== STREAM_ACTION_NAME.CELEBRATION
      )
        stopStreamAction();

      try {
        setIsSendingStreamAction(true);

        const actionData = data[actionName];
        const { duration, question, answers } = actionData;
        const expiry =
          duration > 0
            ? new Date(Date.now() + duration * 1000).toISOString()
            : undefined;
        const startTime = Date.now();
        const pollStreamActionData = {
          duration,
          expiry,
          startTime,
          question,
          votes: answers.reduce((acc, answer) => {
            const option = { option: answer, count: 0, key: uuidv4() };
            acc.push(option);
            return acc;
          }, []),
          voters: {},
          isActive: true,
          pollCreatorId: userData?.trackingId?.toLowerCase()
        };
        const result = await startPoll(pollStreamActionData);

        // Save the form data only if the send request was successful
        const dataToSave = data;
        if (result) {
          dataToSave._active = { duration, expiry, name: actionName };
        }
        // Save data to stream manager local storage
        if (shouldEnableLocalStorage(actionName)) {
          saveStreamManagerActionData(dataToSave);
        }

        setIsSendingStreamAction(false);
        notifySuccess($content.notifications.success[`started_${actionName}`]);

        return result;
      } catch (error) {
        notifyErrorPortal(
          $content.notifications.error.unable_to_start_stream_action
        );
      }
    },
    100
  );

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
        const shouldCheckForDuplicateValidation = [
          STREAM_ACTION_NAME.POLL,
          STREAM_ACTION_NAME.QUIZ
        ].includes(actionName);
        const options = {
          enableDuplicateValidation: shouldCheckForDuplicateValidation
        };

        if (
          !validateStreamManagerActionData(
            data[actionName],
            actionName,
            options
          )
        ) {
          notifyErrorPortal($content.notifications.error.unable_to_send);

          return false;
        }

        resetStreamManagerActionErrorData();

        const result =
          actionName === STREAM_ACTION_NAME.POLL
            ? await sendPollStreamAction(actionName, data)
            : await sendStreamAction(actionName, data);

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
      notifyErrorPortal,
      notifySuccessPortal,
      openModal,
      resetStreamManagerActionData,
      resetStreamManagerActionErrorData,
      saveStreamManagerActionData,
      sendPollStreamAction,
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
      setIsValidKeyword,
      setIsSendingStreamAction,
      endPollOnExpiry,
      cancelActivePoll
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
      setIsLoading,
      setIsSendingStreamAction,
      endPollOnExpiry,
      cancelActivePoll
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreamManagerActions = () => useContextHook(Context);
