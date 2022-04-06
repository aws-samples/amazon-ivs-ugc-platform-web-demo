import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import SigninAndSignup from './pages/UserManagementRouter';
import Dashboard from './pages/Dashboard';

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/*" element={<SigninAndSignup />} />
    </Routes>
  );
};

export default App;
