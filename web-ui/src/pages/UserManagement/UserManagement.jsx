import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { app as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import Grid from '../../components/Grid';
import Notification from '../../components/Notification';
import withSessionLoader from '../../components/withSessionLoader';
import './UserManagement.css';

const UserManagement = ({ children }) => {
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid } = useUser();
  const location = useLocation();

  // Set theme-colour
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', '#000000');
  }, []);

  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  if (isSessionValid === true) return <Navigate to="/" replace />;

  return (
    <Grid>
      <Grid.Col>
        <aside className="welcome-section">
          <h1>{$content.title}</h1>
        </aside>
      </Grid.Col>
      <Grid.Col autoFit>
        <main id="main-user-container" className="main-user-container">
          <Notification top={isMobileView ? 15 : 89} />
          {children ? children : <Outlet />}
        </main>
      </Grid.Col>
    </Grid>
  );
};

UserManagement.defaultProps = { children: null };

UserManagement.propTypes = { children: PropTypes.node };

export default withSessionLoader(UserManagement);
