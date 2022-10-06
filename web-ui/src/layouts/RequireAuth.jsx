import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { MAIN_THEME_COLOR } from '../constants';
import { useUser } from '../contexts/User';
import useThemeColor from '../hooks/useThemeColor';
import withSessionLoader from '../components/withSessionLoader';

const RequireAuth = () => {
  const location = useLocation();
  const { isSessionValid, prevIsSessionValid, logOutAction } = useUser();

  useThemeColor(MAIN_THEME_COLOR);

  if (isSessionValid === false)
    /**
     * Redirect the user to the /login page, but save the current location
     * they were trying to go to when they were redirected. This allows us
     * to send them along to that page after they login.
     */
    return (
      <Navigate
        to={logOutAction === 'logOut' ? '/' : `/login${location?.search || ''}`}
        {...(!prevIsSessionValid ? { state: { from: location } } : {})}
        replace
      />
    );

  return <Outlet />;
};

export default withSessionLoader(RequireAuth);
