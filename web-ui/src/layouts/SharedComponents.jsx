import { Outlet } from 'react-router-dom';

import { useModal } from '../contexts/Modal';
import Modal from '../components/Modal';

/**
 * SharedComponents is a wrapper that renders the shared components/overlays that
 * are shared across the different pages of the app, such as the Modal.
 */
const SharedComponents = () => {
  const { modal } = useModal();

  return (
    <>
      <Outlet />
      <Modal isOpen={!!modal} />
    </>
  );
};

export default SharedComponents;
