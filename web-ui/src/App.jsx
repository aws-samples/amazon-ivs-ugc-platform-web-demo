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

//  Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Channel from './pages/Channel';
import SidebarNavigator from './pages/SidebarNavigator';
import ChannelDirectory from './pages/ChannelDirectory/ChannelDirectory';

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
                    element={<SidebarNavigator />}
                    path="/"
                  >
                    <Route index element={<ChannelDirectory />} />
                    <Route path=":username" element={<Channel />} />
                    <Route path="settings" element={<Settings />} />
                    <Route element={
                      <StreamsProvider>
                        <Dashboard />
                      </StreamsProvider>
                    }>
                      <Route path="dashboard">
                        <Route
                          index
                          element={<Navigate replace to="stream" />}
                        />
                        <Route path="stream">
                          <Route index element={<StreamSession />} />
                          <Route path=":streamId" element={<StreamSession />} />
                        </Route>
                      </Route>
                      <Route
                        path="/dashboard/*"
                        element={<Navigate replace to="/dashboard/stream" />}
                      />
                    </Route>
                    <Route
                      path="*"
                      element={<Navigate replace to="/" />}
                    />
                  </Route>
                  <Route element={<UserManagement />}>
                    <Route path="login" element={<SigninUser />} />
                    <Route path="register" element={<RegisterUser />} />
                    <Route path="reset" element={<ResetPassword />} />
                  </Route>
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
