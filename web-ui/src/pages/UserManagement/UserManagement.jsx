import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { app as $content } from '../../content';
import { useUser } from '../../contexts/User';
import Grid from '../../components/Grid';
import Notification from '../../components/Notification';
import withSessionLoader from '../../components/withSessionLoader';
import './UserManagement.css';

const UserManagement = ({ children }) => {
  const { isSessionValid } = useUser();
  const location = useLocation();

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
        <main className="main-user-container">
          <Notification />
          {children ? children : <Outlet />}
        </main>
      </Grid.Col>
    </Grid>
  );
};

UserManagement.defaultProps = { children: null };

UserManagement.propTypes = { children: PropTypes.node };

export default withSessionLoader(UserManagement);
