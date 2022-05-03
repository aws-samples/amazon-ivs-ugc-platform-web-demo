import { useCallback, useEffect, useMemo, useRef } from 'react';
import { m } from 'framer-motion';

import { app as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import Button from '../Button';
import useClickAway from '../../hooks/useClickAway';
import withPortal from '../withPortal';
import './Modal.css';

const Modal = () => {
  const modalRef = useRef();
  const lastFocusedElement = useRef();
  const { isMobileView } = useMobileBreakpoint();
  const { modal, closeModal } = useModal();
  const {
    cancellable = true,
    confirmText,
    isDestructive,
    message,
    onConfirm,
    subMessage
  } = modal || {};

  const handleClose = useCallback(() => {
    closeModal();
    setTimeout(() => lastFocusedElement.current?.focus());
  }, [closeModal]);

  const handleConfirm = () => {
    handleClose();
    onConfirm();
  };

  // Focus trap to constrain the tab focus to elements within the Modal container
  const handleTabKey = useCallback((event) => {
    const focusableModalElements = modalRef.current.querySelectorAll(
      'a[href], button, textarea, input, select'
    );
    const {
      0: firstElement,
      [focusableModalElements.length - 1]: lastElement
    } = focusableModalElements;

    if (!event.shiftKey && document.activeElement !== firstElement) {
      event.preventDefault();
      firstElement.focus();
    }

    if (event.shiftKey && document.activeElement !== lastElement) {
      event.preventDefault();
      lastElement.focus();
    }
  }, []);

  const keyListenersMap = useMemo(
    () =>
      new Map([
        [27, handleClose],
        [9, handleTabKey]
      ]),
    [handleClose, handleTabKey]
  );

  useClickAway(modalRef, handleClose);

  useEffect(() => {
    const keyListener = (event) => {
      const listener = keyListenersMap.get(event.keyCode);
      return listener && listener(event);
    };

    if (modal) {
      document.addEventListener('keydown', keyListener);
      lastFocusedElement.current = document.activeElement;
      lastFocusedElement.current.blur();
    }

    return () => document.removeEventListener('keydown', keyListener);
  }, [handleClose, keyListenersMap, modal]);

  return (
    modal && (
      <m.div
        className="modal"
        ref={modalRef}
        animate="visible"
        exit="hidden"
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 }
        }}
      >
        <h3>{message}</h3>
        {subMessage && <p>{subMessage}</p>}
        <div className="modal-buttons">
          {cancellable && (
            <Button
              customStyles={{ width: isMobileView ? '100%' : 'auto' }}
              onClick={handleClose}
              variant="link"
            >
              {$content.modal.cancel}
            </Button>
          )}
          <Button
            customStyles={{ width: isMobileView ? '100%' : 'auto' }}
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </m.div>
    )
  );
};

export default withPortal(Modal, 'modal');
