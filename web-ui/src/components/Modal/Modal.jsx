import { m } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { clsm } from '../../utils';
import { app as $content } from '../../content';
import { BREAKPOINTS } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import Button from '../Button';
import useClickAway from '../../hooks/useClickAway';
import useFocusTrap from '../../hooks/useFocusTrap';
import usePrevious from '../../hooks/usePrevious';
import withPortal from '../withPortal';

const Modal = () => {
  const modalRef = useRef();
  const lastFocusedElement = useRef();
  const { currentBreakpoint } = useMobileBreakpoint();
  const isResponsiveView = currentBreakpoint < BREAKPOINTS.sm;
  const { modal, closeModal } = useModal();
  const {
    cancellable = true,
    confirmText,
    isDestructive,
    message,
    onConfirm,
    onCancel,
    subMessage
  } = modal || {};
  const { pathname } = useLocation();
  const prevPathname = usePrevious(pathname);

  const modalContainerClasses = clsm([
    'dark:bg-darkMode-gray',
    'rounded-3xl',
    'm-[length:var(--mobile-x-spacing)]',
    'p-8',
    'dark:[&>p]:text-darkMode-gray-extraLight',
    '[&>p]:mt-4',
    'bg-lightMode-gray-light',
    '[&>p]:text-black'
  ]);

  const modalButtonsClasses = clsm([
    'flex',
    'items-center',
    'justify-end',
    'mt-8',
    'gap-x-2.5',
    'sm:flex-col-reverse',
    'sm:[&>button+button]:mb-5'
  ]);

  const handleClose = useCallback(
    (event) => {
      if (event && event instanceof KeyboardEvent && event.keyCode !== 27)
        return;

      closeModal();
      setTimeout(() => lastFocusedElement.current?.focus());

      if (typeof onCancel === 'function') {
        onCancel();
      }
    },
    [closeModal, onCancel]
  );

  const handleConfirm = () => {
    handleClose();

    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  useClickAway([modalRef], handleClose, cancellable);
  useFocusTrap([modalRef], !!modal);

  useEffect(() => {
    if (!!modal) {
      document.addEventListener('keydown', handleClose);
      lastFocusedElement.current = document.activeElement;
      lastFocusedElement.current.blur();
    }

    return () => document.removeEventListener('keydown', handleClose);
  }, [handleClose, modal]);

  // Close the modal on page change
  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) closeModal();
  }, [closeModal, pathname, prevPathname]);

  return (
    modal && (
      <m.div
        className={modalContainerClasses}
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
        {subMessage && <p className="p1">{subMessage}</p>}
        <div className={modalButtonsClasses}>
          {cancellable && (
            <Button
              customStyles={{ width: isResponsiveView ? '100%' : 'auto' }}
              onClick={handleClose}
              variant="secondaryText"
            >
              {$content.modal.cancel}
            </Button>
          )}
          <Button
            customStyles={{ width: isResponsiveView ? '100%' : 'auto' }}
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

export default withPortal(Modal, 'modal', {
  containerClasses: [
    'flex',
    'items-center',
    'justify-center',
    'h-full',
    'fixed',
    'top-0',
    'left-0',
    'w-full',
    'z-[1000]',
    'bg-modalOverlay'
  ]
});
