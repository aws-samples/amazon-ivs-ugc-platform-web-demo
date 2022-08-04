import { Outlet } from 'react-router-dom';

import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import Navbar from './Navbar';
import withSessionLoader from '../../components/withSessionLoader';
import './AppLayoutWithNavbar.css';

const AppLayoutWithNavbar = () => {
  const { isDefaultResponsiveView, mainRef } = useMobileBreakpoint();
  const { isSessionValid } = useUser();

  return (
    <div className="app-layout">
      <Navbar />
      <main
        id={`main-app-container${isDefaultResponsiveView ? '' : '-scrollable'}`}
        className={`main-app-container ${isSessionValid ? 'auth' : 'unauth'}`}
        ref={mainRef}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default withSessionLoader(AppLayoutWithNavbar);
