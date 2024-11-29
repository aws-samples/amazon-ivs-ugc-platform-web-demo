import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  Await,
  useLoaderData,
  Outlet,
  useOutletContext
} from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as ReduxProvider } from 'react-redux';
import { Suspense } from 'react';

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
import { Provider as AppSyncProvider } from './contexts/AppSync/AppSync';

// Pages
import {
  Channel,
  ChannelDirectory,
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

import ErrorBoundary from './components/ErrorBoundary';
import store, { persistor } from './store';

// Page Layouts
import { AppLayoutWithNavbar, RequireAuth } from './layouts';
import { localStorageProvider } from './contexts/StageManager/localStorage';
import { SWRConfig } from 'swr';
import { StageManagerProvider } from './contexts/StageManager';
import { DeviceManagerProvider } from './contexts/DeviceManager';
import {
  channelStageLoader,
  managerLoader,
  stageLoader,
  stateCleanupLoader
} from './loaders';

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
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ErrorBoundary>
              <MotionConfig reducedMotion="user">
                <LastFocusedElementProvider>
                  <ResponsiveDeviceProvider>
                    <NotificationProvider>
                      <ModalProvider>
                        <TooltipsProvider>
                          <UserProvider>
                            <SWRConfig
                              value={{ provider: localStorageProvider }}
                            />
                          </UserProvider>
                        </TooltipsProvider>
                      </ModalProvider>
                    </NotificationProvider>
                  </ResponsiveDeviceProvider>
                </LastFocusedElementProvider>
              </MotionConfig>
            </ErrorBoundary>
          </PersistGate>
        </ReduxProvider>
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
        <Route
          index
          element={<ChannelDirectory />}
          loader={stateCleanupLoader}
        />
        <Route
          path=":username"
          loader={channelStageLoader}
          shouldRevalidate={(data) => {
            if (
              JSON.stringify(data.nextParams) !==
              JSON.stringify(data.currentParams)
            ) {
              return false;
            }

            return data.defaultShouldRevalidate;
          }}
          element={
            <AppSyncProvider>
              <ViewerStreamActionsProvider>
                <ChannelLoader />
              </ViewerStreamActionsProvider>
            </AppSyncProvider>
          }
        >
          <Route index element={<Channel />} />
          <Route path="profile" element={<Channel />} />
          <Route
            path="*"
            element={<Navigate replace to={updateTo('/:username')} />}
          />
        </Route>
        {/* PRIVATE PAGES */}
        <Route element={<RequireAuth />}>
          <Route
            path="following"
            element={<Following />}
            loader={stateCleanupLoader}
            shouldRevalidate={() => false}
          />
          <Route
            path="settings"
            element={<Settings />}
            loader={stateCleanupLoader}
            shouldRevalidate={() => false}
          />
          <Route
            loader={managerLoader}
            shouldRevalidate={() => false}
            path="manager"
            element={
              <AppSyncProvider>
                <DeviceManagerProvider />
              </AppSyncProvider>
            }
          >
            <Route
              index
              element={<StreamManager />}
              loader={stateCleanupLoader}
              shouldRevalidate={() => false}
            />
            <Route
              path="collab"
              loader={stageLoader}
              shouldRevalidate={() => false}
              element={
                <StageManagerProvider>
                  <StreamManager />
                </StageManagerProvider>
              }
            />
          </Route>
          <Route
            path="health"
            element={<AppSyncProvider />}
            loader={stateCleanupLoader}
            shouldRevalidate={() => false}
          >
            <Route index element={<StreamHealth />} />
            <Route path=":streamId" element={<StreamHealth />} />
            <Route path="*" element={<Navigate replace to="/health" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>

      {/* PUBLIC PAGES - User Management */}
      <Route element={<UserManagement />} loader={stateCleanupLoader}>
        <Route path="login" element={<SigninUser />} />
        <Route path="register" element={<RegisterUser />} />
        <Route path="reset" element={<ResetPassword />} />
      </Route>
    </Route>
  )
);

function ChannelLoader() {
  const { channelStageResponse } = useLoaderData();
  const outletContext = useOutletContext();

  return (
    <Suspense fallback={<Channel />}>
      <Await resolve={channelStageResponse} errorElement={<Channel />}>
        {(stageConfig) => {
          return stageConfig ? (
            <DeviceManagerProvider>
              <StageManagerProvider>
                <Outlet context={outletContext} />
              </StageManagerProvider>
            </DeviceManagerProvider>
          ) : (
            <Outlet context={outletContext} />
          );
        }}
      </Await>
    </Suspense>
  );
}

const App = () => <RouterProvider router={router} />;

export default App;
