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
import { Provider as StreamsProvider } from './contexts/Streams';
import { Provider as UserProvider } from './contexts/User';

// Pages
import {
  Channel,
  ChannelDirectory,
  Feed,
  Following,
  Settings,
  StreamHealth,
  StreamManager,
  UserManagement
} from './pages';

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
                      {/* PUBLIC PAGES */}
                      <Route index element={<ChannelDirectory />} />
                      <Route path=":username" element={<Channel />} />
                      <Route path="feed" element={<Feed />} />

                      {/* PRIVATE PAGES */}
                      <Route element={<RequireAuth />}>
                        <Route path="settings" element={<Settings />} />
                        <Route path="following" element={<Following />} />
                        <Route element={<StreamsProvider />}>
                          <Route path="manager" element={<StreamManager />} />
                          <Route path="health">
                            <Route index element={<StreamHealth />} />
                            <Route
                              path=":streamId"
                              element={<StreamHealth />}
                            />
                            <Route
                              path="*"
                              element={<Navigate replace to="/health" />}
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
