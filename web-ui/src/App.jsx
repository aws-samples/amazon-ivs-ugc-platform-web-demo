import { LazyMotion, MotionConfig } from 'framer-motion';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

// Context Providers
import { Provider as MobileBreakpointProvider } from './contexts/MobileBreakpoint';
import { Provider as ModalProvider } from './contexts/Modal';
import { Provider as NotificationProvider } from './contexts/Notification';
import { Provider as UserProvider } from './contexts/User';
import { Provider as StreamsProvider } from './contexts/Streams';

// Layout Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';

// Dashboard Pages
import { Settings, StreamSession } from './pages/Dashboard/subpages';

// UserManagement Pages
import {
  RegisterUser,
  ResetPassword,
  SigninUser
} from './pages/UserManagement/subpages';

const loadMotionFeatures = () =>
  import('./motion-features').then((res) => res.default);

const App = () => (
  <Router>
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <MobileBreakpointProvider>
          <NotificationProvider>
            <UserProvider>
              <ModalProvider>
                <Routes>
                  <Route
                    element={
                      <StreamsProvider>
                        <Dashboard />
                      </StreamsProvider>
                    }
                  >
                    <Route path="dashboard">
                      <Route path="stream">
                        <Route index element={<StreamSession />} />
                        <Route path=":streamId" element={<StreamSession />} />
                      </Route>
                    </Route>
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route element={<UserManagement />}>
                    <Route path="login" element={<SigninUser />} />
                    <Route path="register" element={<RegisterUser />} />
                    <Route path="reset" element={<ResetPassword />} />
                  </Route>
                  <Route
                    path="*"
                    element={<Navigate replace to="/dashboard/stream" />}
                  />
                </Routes>
              </ModalProvider>
            </UserProvider>
          </NotificationProvider>
        </MobileBreakpointProvider>
      </MotionConfig>
    </LazyMotion>
  </Router>
);

export default App;
