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
        'm-[length:var(--mobile-x-spacing)]',
        'rounded-3xl',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray',
        className
      ])}
      ref={modalRef}
      animate="visible"
      exit="hidden"
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0 }
      }}
      data-test-id="modal"
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
