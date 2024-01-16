import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider
} from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

// Context Providers
import { Provider as ChannelProvider } from './contexts/Channel';
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
  // Feed,
  Following,
  Settings,
  StreamHealth,
  StreamManager,
  StageManager,
  UserManagement,
  ClassRoom
} from './pages';

// UserManagement Subpages
import {
  RegisterUser,
  ResetPassword,
  SigninUser
} from './pages/UserManagement/subpages';

// Page Layouts
import { AppLayoutWithNavbar, RequireAuth } from './layouts';

const updateTo = (to) => {
  const { pathname } = new URL(window.location.href);
  const params = pathname.split('/').filter((part) => part);

  const replacedTo = to
    .split('/')
    .filter((part) => part)
    .map((part, i) => (part.startsWith(':') ? params[i] : part))
    .join('/');

  return `/${replacedTo}`;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={
        <MotionConfig reducedMotion="user">
          <LastFocusedElementProvider>
            <ResponsiveDeviceProvider>
              <NotificationProvider>
                <ModalProvider>
                  <TooltipsProvider>
                    <UserProvider />
                  </TooltipsProvider>
                </ModalProvider>
              </NotificationProvider>
            </ResponsiveDeviceProvider>
          </LastFocusedElementProvider>
        </MotionConfig>
      }
    >
      <Route
        element={
          <StreamsProvider>
            <ChannelProvider>
              <AppLayoutWithNavbar />
            </ChannelProvider>
          </StreamsProvider>
        }
      >
        {/* PUBLIC PAGES - UGC */}
        <Route index element={<ChannelDirectory />} />
        <Route path=":username">
          <Route element={<ViewerStreamActionsProvider />}>
            <Route index element={<Channel />} />
            <Route path="profile" element={<Channel />} />
            <Route
              path="*"
              element={<Navigate replace to={updateTo('/:username')} />}
            />
          </Route>
        </Route>
        {/* <Route path="feed" element={<Feed />} /> */}

        {/* PRIVATE PAGES */}
        <Route element={<RequireAuth />}>
          <Route path="following" element={<Following />} />
          <Route path="settings" element={<Settings />} />
          <Route path="manager" element={<StreamManager />} />
          <Route path="stage" element={<ClassRoom />} />
          <Route path="classroom" element={<ClassRoom />} />
          <Route path="health">
            <Route index element={<StreamHealth />} />
            <Route path=":streamId" element={<StreamHealth />} />
            <Route path="*" element={<Navigate replace to="/health" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>

      {/* PUBLIC PAGES - User Management */}
      <Route element={<UserManagement />}>
        <Route path="login" element={<SigninUser />} />
        <Route path="register" element={<RegisterUser />} />
        <Route path="reset" element={<ResetPassword />} />
      </Route>
    </Route>
  )
);

const App = () => <RouterProvider router={router} />;

export default App;
