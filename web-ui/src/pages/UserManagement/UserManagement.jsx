import { Navigate, Outlet, useLocation } from 'react-router-dom';

import './UserManagement.css';
import { app as $content } from '../../content';
import { BREAKPOINTS, USER_MANAGEMENT_THEME_COLOR } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import FullScreenLoader from '../../components/FullScreenLoader';
import Grid from '../../components/Grid';
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
    <Grid>
      <Grid.Col>
        <aside className="welcome-section">
          <h1>{$content.title}</h1>
        </aside>
      </Grid.Col>
      <Grid.Col autoFit>
        <main
          id={`main-user-container${isResponsiveView ? '' : '-scrollable'}`}
          className="main-user-container"
          ref={mainRef}
        >
          {isCreatingResources || hasErrorCreatingResources ? (
            <FullScreenLoader
              hasError={hasErrorCreatingResources}
              mobileBreakpoint={BREAKPOINTS.lg}
              onClick={initUserResources}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </Grid.Col>
    </Grid>
  );
};

export default withSessionLoader(UserManagement, BREAKPOINTS.lg);
