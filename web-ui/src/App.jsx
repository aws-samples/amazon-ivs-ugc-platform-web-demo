import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion } from 'framer-motion';

import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import { Provider as MobileBreakpointProvider } from './contexts/MobileBreakpoint';
import { Provider as NotificationProvider } from './contexts/Notification';
import { Provider as UserProvider } from './contexts/User';

const loadMotionFeatures = () =>
  import('./motion-features').then((res) => res.default);

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <MobileBreakpointProvider>
      <UserProvider>
        <NotificationProvider>
          <LazyMotion features={loadMotionFeatures} strict>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/*" element={<UserManagement />} />
            </Routes>
          </LazyMotion>
        </NotificationProvider>
      </UserProvider>
    </MobileBreakpointProvider>
  );
};

export default App;
