import { Navigate, Outlet } from 'react-router-dom';

import './UserManagement.css';
import { app as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { USER_MANAGEMENT_THEME_COLOR } from '../../constants';
import { useUser } from '../../contexts/User';
import FullScreenLoader from '../../components/FullScreenLoader';
import Grid from '../../components/Grid';
import Notification from '../../components/Notification';
import useScrollTopOnPathnameChange from '../../hooks/useScrollTopOnPathnameChange';
import useThemeColor from '../../hooks/useThemeColor';
import withSessionLoader from '../../components/withSessionLoader';

const UserManagement = () => {
  const { isMobileView } = useMobileBreakpoint();
  const {
    hasErrorCreatingResources,
    initUserResources,
    isCreatingResources,
    isSessionValid
  } = useUser();
  useScrollTopOnPathnameChange();
  useThemeColor(USER_MANAGEMENT_THEME_COLOR);

  if (
    isSessionValid === true &&
    !isCreatingResources &&
    !hasErrorCreatingResources
  ) {
    return <Navigate to="/" replace />;
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
          id={`main-user-container${isMobileView ? '' : '-scrollable'}`}
          className="main-user-container"
        >
          {isCreatingResources || hasErrorCreatingResources ? (
            <FullScreenLoader
              hasError={hasErrorCreatingResources}
              onClick={initUserResources}
            />
          ) : (
            <>
              <Notification top={isMobileView ? 15 : 89} />
              <Outlet />
            </>
          )}
        </main>
      </Grid.Col>
    </Grid>
  );
};

export default withSessionLoader(UserManagement);
