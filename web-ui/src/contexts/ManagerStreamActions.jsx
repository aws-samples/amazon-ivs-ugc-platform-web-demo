import { createContext, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { MODAL_TYPE, useModal } from './Modal';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'ManagerStreamActions';

export const MANAGER_STREAM_ACTION_NAME = {
  QUIZ: 'quiz',
  PRODUCT: 'product',
  NOTICE: 'notice',
  CELEBRATION: 'celebration'
};

const DEFAULT_STATE = {
  [MANAGER_STREAM_ACTION_NAME.QUIZ]: { value: '' },
  [MANAGER_STREAM_ACTION_NAME.PRODUCT]: {},
  [MANAGER_STREAM_ACTION_NAME.NOTICE]: {},
  [MANAGER_STREAM_ACTION_NAME.CELEBRATION]: {}
};

export const Provider = ({ children }) => {
  const { openModal } = useModal();
  const [managerStreamActionData, setManagerStreamActionData] =
    useState(DEFAULT_STATE);

  const getManagerStreamActionData = useCallback(
    (actionName) => managerStreamActionData[actionName],
    [managerStreamActionData]
  );

  const updateManagerStreamActionData = useCallback((newData, actionName) => {
    setManagerStreamActionData((prevData) => ({
      ...prevData,
      [actionName]: {
        ...prevData[actionName],
        ...newData
      }
    }));
  }, []);

  /* Saves the form data in local storage */
  const save = () => console.info('Saved');

  /* Sends a timed metadata event to all stream viewers */
  const send = (actionName) => {
    // Attach a "name" property
    // Attach a "startTime" property
    console.info('Timed metadata sent', actionName);
  };

  const openManagerStreamActionModal = useCallback(
    (modalData) => {
      openModal({
        onSave: () => save(modalData.data),
        onConfirm: () => send(modalData.data),
        type: MODAL_TYPE.MANAGER_STREAM_ACTION,
        ...modalData
      });
    },
    [openModal]
  );

  const value = useMemo(
    () => ({
      getManagerStreamActionData,
      openManagerStreamActionModal,
      updateManagerStreamActionData
    }),
    [
      getManagerStreamActionData,
      openManagerStreamActionModal,
      updateManagerStreamActionData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useManagerStreamActions = () => useContextHook(Context);
