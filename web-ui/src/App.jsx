import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'framer-motion';

// Context Providers
import { Provider as ChannelProvider } from './contexts/Channel';
import { Provider as ChatMessagesProvider } from './contexts/ChatMessages';
import { Provider as LastFocusedElementProvider } from './contexts/LastFocusedElement';
import { Provider as ModalProvider } from './contexts/Modal';
import { Provider as NotificationProvider } from './contexts/Notification';
import { Provider as ResponsiveDeviceProvider } from './contexts/ResponsiveDevice';
import { Provider as StreamsProvider } from './contexts/Streams';
import { Provider as TooltipsProvider } from './contexts/Tooltips';
import { Provider as UserProvider } from './contexts/User';
import { Provider as ViewerStreamActionsProvider } from './contexts/ViewerStreamActions';

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
import { AppLayoutWithNavbar, RequireAuth } from './layouts';

const loadMotionFeatures = () =>
  import('./motion-features').then((res) => res.default);

const App = () => (
  <Router>
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <LastFocusedElementProvider>
          <ResponsiveDeviceProvider>
            <NotificationProvider>
              <ModalProvider>
                <TooltipsProvider>
                  <UserProvider>
                    <StreamsProvider>
                      <Routes>
                        <Route
                          element={
                            <ChannelProvider>
                              <ChatMessagesProvider>
                                <AppLayoutWithNavbar />
                              </ChatMessagesProvider>
                            </ChannelProvider>
                          }
                        >
                          {/* PUBLIC PAGES - UGC */}
                          <Route index element={<ChannelDirectory />} />
                          <Route
                            path=":username"
                            element={
                              <ViewerStreamActionsProvider>
                                <Channel />
                              </ViewerStreamActionsProvider>
                            }
                          />
                          <Route path="feed" element={<Feed />} />

                          {/* PRIVATE PAGES */}
                          <Route element={<RequireAuth />}>
                            <Route path="following" element={<Following />} />
                            <Route path="settings" element={<Settings />} />
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
                          <Route
                            path="*"
                            element={<Navigate replace to="/" />}
                          />
                        </Route>

                        {/* PUBLIC PAGES - User Management */}
                        <Route element={<UserManagement />}>
                          <Route path="login" element={<SigninUser />} />
                          <Route path="register" element={<RegisterUser />} />
                          <Route path="reset" element={<ResetPassword />} />
                        </Route>
                      </Routes>
                    </StreamsProvider>
                  </UserProvider>
                </TooltipsProvider>
              </ModalProvider>
            </NotificationProvider>
          </ResponsiveDeviceProvider>
        </LastFocusedElementProvider>
      </MotionConfig>
    </LazyMotion>
  </Router>
);

export default App;
