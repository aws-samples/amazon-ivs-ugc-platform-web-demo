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

// Pages
import {
  Channel,
  ChannelDirectory,
  Dashboard,
  Settings,
  UserManagement
} from './pages';

// Dashboard Subpages
import { StreamSession } from './pages/Dashboard/subpages';

// UserManagement Subpages
import {
  RegisterUser,
  ResetPassword,
  SigninUser
} from './pages/UserManagement/subpages';

// Page Layouts
import { AppLayoutWithNavbar, RequireAuth, SharedComponents } from './layouts';

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
                  <Route element={<SharedComponents />}>
                    <Route element={<AppLayoutWithNavbar />}>
                      <Route index element={<ChannelDirectory />} />
                      <Route path=":username" element={<Channel />} />
                      <Route element={<RequireAuth />}>
                        <Route path="settings" element={<Settings />} />
                        <Route
                          element={
                            <StreamsProvider>
                              <Dashboard />
                            </StreamsProvider>
                          }
                        >
                          <Route path="dashboard">
                            <Route
                              index
                              element={<Navigate replace to="stream" />}
                            />
                            <Route path="stream">
                              <Route index element={<StreamSession />} />
                              <Route
                                path=":streamId"
                                element={<StreamSession />}
                              />
                            </Route>
                            <Route
                              path="*"
                              element={
                                <Navigate replace to="/dashboard/stream" />
                              }
                            />
                          </Route>
                        </Route>
                      </Route>
                      <Route path="*" element={<Navigate replace to="/" />} />
                    </Route>
                    <Route element={<UserManagement />}>
                      <Route path="login" element={<SigninUser />} />
                      <Route path="register" element={<RegisterUser />} />
                      <Route path="reset" element={<ResetPassword />} />
                    </Route>
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
