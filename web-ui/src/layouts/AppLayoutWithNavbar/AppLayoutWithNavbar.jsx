import { Outlet } from 'react-router-dom';

import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import Navbar from './Navbar';
import './AppLayoutWithNavbar.css';

const AppLayoutWithNavbar = () => {
  const { isDefaultResponsiveView, mainRef } = useMobileBreakpoint();

  return (
    <div className="app-layout">
      <Navbar />
      <main
        id={`main-app-container${isDefaultResponsiveView ? '' : '-scrollable'}`}
        className="main-app-container"
        ref={mainRef}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayoutWithNavbar;
