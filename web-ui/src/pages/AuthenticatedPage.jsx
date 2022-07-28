import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { DASHBOARD_THEME_COLOR } from '../constants';
import { useUser } from '../contexts/User';
import useThemeColor from '../hooks/useThemeColor';
import withSessionLoader from '../components/withSessionLoader';

const AuthenticatedPage = () => {
  const location = useLocation();
  const { isSessionValid, prevIsSessionValid } = useUser();

  useThemeColor(DASHBOARD_THEME_COLOR);

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

  return <Outlet />;
};

export default withSessionLoader(AuthenticatedPage);
