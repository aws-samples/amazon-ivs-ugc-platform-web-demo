import { createContext, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { noop } from '../utils';
import { useLastFocusedElement } from './LastFocusedElement';
import useContextHook from './useContextHook';
import usePreviousFocus from '../hooks/usePreviousFocus';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Modal';

export const MODAL_TYPE = {
  CONFIRMATION: 'CONFIRMATION',
  PRODUCT_DESCRIPTION: 'PRODUCT_DESCRIPTION',
  STREAM_BROADCAST_SETTINGS: 'STREAM_BROADCAST_SETTINGS',
  STAGE_PARTICIPANTS: 'STAGE_PARTICIPANTS',
  STREAM_MANAGER_ACTION: 'STREAM_MANAGER_ACTION',
  STAGE_JOIN: 'STAGE_JOIN'
};

/**
 * @typedef {Object} Modal The data object that is passed from the openModal function in order to open a new Modal
 * @property {Function} [onCancel=()=>{}] Called when the Modal is cancelled (i.e. clicking the "Cancel" button, pressing the Escape key, or clicking anywhere outside the Modal)
 * @property {Function} [onConfirm=()=>{}] Called when the Modal is submitted through user input
 * @property {Function} [onSave=()=>{}] Saves the Modal data (only used for STREAM_MANAGER_ACTION modals)
 * @property {string} [type=CONFIRMATION] The type of Modal (defaults to CONFIRMATION)
 * @property {object} [lastFocusedElement] A ref pointing to the element that you wish to refocus when the modal closes
 * @property {object} content The data that the Modal component receives and uses to render the Modal
 */

/**
 * The Modal context acts the orchestrator for all the Modals in the app.
 *
 * It receives data via the openModal function, which it then uses to provide the
 * necessary content properties and handlers to the respective Modal component.
 * It also ensures that only 1 Modal component is rendered at any given time.
 */
export const Provider = ({ children }) => {
  /** @type {[Modal, Function]} */
  const [modal, setModal] = useStateWithCallback(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setLastFocusedElement } = useLastFocusedElement();
  const {
    onCancel = noop,
    onConfirm = noop,
    onSave = noop,
    type
  } = modal || {};
  const { refocus } = usePreviousFocus({
    isActive: isModalOpen,
    onRefocus: (isKeyEvent) => {
      if (modal?.type === MODAL_TYPE.STAGE_JOIN) return;

      setIsModalOpen(false);
      isKeyEvent && onCancel();
    }
  });

  const openModal = useCallback(
    (modalData) => {
      const { lastFocusedElement, type = MODAL_TYPE.CONFIRMATION } = modalData;

      if (lastFocusedElement) setLastFocusedElement(lastFocusedElement.current);

      setModal({ ...modalData, type }, () => setIsModalOpen(true));
    },
    [setLastFocusedElement, setModal]
  );

  const closeModal = useCallback(
    ({ shouldCancel = true, shouldRefocus = true } = {}) => {
      setIsModalOpen(false);
      if (shouldRefocus) refocus();
      if (shouldCancel) onCancel();
    },
    [onCancel, refocus]
  );

  const handleSave = useCallback((data) => onSave(data), [onSave]);

  const handleConfirm = useCallback(
    async (data) => {
      const shouldCloseModal = await onConfirm(data);

      if (shouldCloseModal === false) return;

      closeModal({ shouldCancel: false, shouldRefocus: false });
    },
    [closeModal, onConfirm]
  );

  const value = useMemo(
    () => ({
      ...modal,
      closeModal,
      handleConfirm,
      handleSave,
      isModalOpen,
      openModal,
      type
    }),
    [modal, closeModal, handleConfirm, handleSave, isModalOpen, openModal, type]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useModal = () => useContextHook(Context);
