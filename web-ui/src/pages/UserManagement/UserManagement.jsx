import { Navigate, Outlet, useLocation } from 'react-router-dom';

import './UserManagement.css';
import { BREAKPOINTS, USER_MANAGEMENT_THEME_COLOR } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import FullScreenLoader from '../../components/FullScreenLoader';
import Notification from '../../components/Notification';
import useScrollToTop from '../../hooks/useScrollToTop';
import useThemeColor from '../../hooks/useThemeColor';
import withSessionLoader from '../../components/withSessionLoader';

const UserManagement = () => {
  const {
    hasErrorCreatingResources,
    initUserResources,
    isCreatingResources,
    isSessionValid
  } = useUser();
  const { currentBreakpoint, mainRef } = useMobileBreakpoint();
  const isResponsiveView = currentBreakpoint < BREAKPOINTS.lg;
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useScrollToTop({ isResponsiveView });
  useThemeColor(USER_MANAGEMENT_THEME_COLOR);

  if (
    isSessionValid === true &&
    !isCreatingResources &&
    !hasErrorCreatingResources
  ) {
    /**
     * Send the user back to the page they tried to visit when they were
     * redirected to the login page, setting replace to "true" so we don't
     * create another entry in the history stack for the login page.
     */
    return <Navigate to={from} replace />;
  }

  return (
    <main
      id={`main-user-container${isResponsiveView ? '' : '-scrollable'}`}
      className="main-user-container bg-lightMode-gray-extraLight dark:bg-black"
      ref={mainRef}
    >
      <Notification />
      {isCreatingResources || hasErrorCreatingResources ? (
        <FullScreenLoader
          hasError={hasErrorCreatingResources}
          mobileBreakpoint={BREAKPOINTS.lg}
          onClick={initUserResources}
        />
      ) : (
        <div className="user-page-content">
          <Outlet />
        </div>
      )}
      <Notification />
    </main>
  );
};

export default withSessionLoader(UserManagement, BREAKPOINTS.lg);
