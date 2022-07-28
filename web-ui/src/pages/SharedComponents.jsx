import { Outlet } from 'react-router-dom';

import { useModal } from '../contexts/Modal';
import Modal from '../components/Modal';
import Notification from '../components/Notification';

/**
 * SharedComponents is a wrapper that renders the shared components/overlays that
 * are shared across the different pages of the app, such as the Modal and Notification.
 */
const SharedComponents = () => {
  const { modal } = useModal();

  return (
    <>
      <Modal isOpen={!!modal} />
      <Notification top={79} />
      <Outlet />
    </>
  );
};

export default SharedComponents;
