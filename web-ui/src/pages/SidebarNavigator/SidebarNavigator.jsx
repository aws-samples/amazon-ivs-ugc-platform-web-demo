import { Navigate, Outlet, useLocation } from 'react-router-dom';

import './SidebarNavigator.css';
import { useModal } from '../../contexts/Modal';
import { useUser } from '../../contexts/User';
import Modal from '../../components/Modal';
import withSessionLoader from '../../components/withSessionLoader';

const SidebarNavigator = () => {
  const { isSessionValid, prevIsSessionValid } =
    useUser();
  const { modal } = useModal();
  const location = useLocation();

  if (isSessionValid === false)
    /**
     * Redirect the user to the /login page, but save the current location
     * they were trying to go to when they were redirected. This allows us
     * to send them along to that page after they login.
     */
    return (
      <Navigate
        to={`/login${location?.search || ''}`}
        {...(!prevIsSessionValid ? { state: { from: location } } : {})}
        replace
      />
    );
  
  return (
    <>
      <Modal isOpen={!!modal} />
      <Outlet />
    </>
  );
};

export default withSessionLoader(SidebarNavigator);
