import { m } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { useModal } from '../../contexts/Modal';
import useClickAway from '../../hooks/useClickAway';
import usePrevious from '../../hooks/usePrevious';
import useFocusTrap from '../../hooks/useFocusTrap';
import withPortal from '../withPortal';

const Modal = ({ children, className }) => {
  const { closeModal } = useModal();
  const { pathname } = useLocation();
  const modalRef = useRef();
  const prevPathname = usePrevious(pathname);

  useFocusTrap([modalRef]);
  useClickAway([modalRef], () => closeModal({ shouldRefocus: false }));

  // Close the modal on page change
  useEffect(() => {
    if (prevPathname && prevPathname !== pathname) {
      closeModal({ shouldCancel: false, shouldRefocus: false });
    }
  }, [closeModal, pathname, prevPathname]);

  return (
    <m.div
      className={clsm([
        'p-8',
        'm-[var(--mobile-x-spacing)]',
        'rounded-3xl',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray',
        'max-w-[595px]',
        className
      ])}
      ref={modalRef}
      animate="visible"
      initial="hidden"
      transition={{ duration: 0.15, type: 'tween' }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0.5, y: 25 }
      }}
      data-testid="modal"
    >
      {children}
    </m.div>
  );
};

Modal.defaultProps = { className: '' };

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default withPortal(Modal, 'modal', {
  baseContainerClasses: [
    'flex',
    'items-center',
    'justify-center',
    'h-full',
    'fixed',
    'top-0',
    'left-0',
    'w-full',
    'bg-modalOverlay',
    'z-[700]'
  ]
});
