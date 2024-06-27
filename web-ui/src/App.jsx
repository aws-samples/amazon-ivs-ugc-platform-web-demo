import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  redirect,
  Await,
  useLoaderData,
  Outlet,
  defer,
  useOutletContext
} from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
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
import { GlobalStageProvider } from './contexts/Stage';

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

// Page Layouts
import { AppLayoutWithNavbar, RequireAuth } from './layouts';
import { localStorageProvider } from './contexts/StageManager/localStorage';
import { SWRConfig } from 'swr';
import { StageManagerProvider } from './contexts/StageManager';
import { DeviceManagerProvider } from './contexts/DeviceManager';
import {
  DISPLAY_STAGE_ID_URL_PARAM,
  REQUEST_URL_PARAM_KEY,
  USER_STAGE_ID_URL_PARAM
} from './helpers/stagesHelpers';
import { PARTICIPANT_TYPES } from './contexts/Stage/Global/reducer/globalReducer';
import { channelAPI, channelsAPI, stagesAPI } from './api';

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
        <ErrorBoundary>
          <MotionConfig reducedMotion="user">
            <LastFocusedElementProvider>
              <ResponsiveDeviceProvider>
                <NotificationProvider>
                  <ModalProvider>
                    <TooltipsProvider>
                      <UserProvider>
                        <SWRConfig value={{ provider: localStorageProvider }} />
                      </UserProvider>
                    </TooltipsProvider>
                  </ModalProvider>
                </NotificationProvider>
              </ResponsiveDeviceProvider>
            </LastFocusedElementProvider>
          </MotionConfig>
        </ErrorBoundary>
      }
    >
      <Route
        element={
          <StreamsProvider>
            <GlobalStageProvider>
              <ChannelProvider>
                <AppLayoutWithNavbar />
              </ChannelProvider>
            </GlobalStageProvider>
          </StreamsProvider>
        }
      >
        {/* PUBLIC PAGES - UGC */}
        <Route index element={<ChannelDirectory />} />
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
          <Route path="following" element={<Following />} />
          <Route path="settings" element={<Settings />} />
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
            <Route index element={<StreamManager />} />
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
          <Route path="health" element={<AppSyncProvider />}>
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

async function stageLoader({ params, request }) {
  const { pathname, searchParams } = new URL(request.url);
  if (pathname !== '/manager/collab') {
    throw redirect('/manager');
  }
  if (searchParams.size > 0) {
    // Joining by invite or request
    const userStageId = searchParams.get(USER_STAGE_ID_URL_PARAM);
    const displayStageId = searchParams.get(DISPLAY_STAGE_ID_URL_PARAM);
    const isJoiningStageByRequest =
      searchParams.get(REQUEST_URL_PARAM_KEY) || false;

    const participantType = isJoiningStageByRequest
      ? PARTICIPANT_TYPES.REQUESTED
      : PARTICIPANT_TYPES.INVITED;

    const { result, error } = await stagesAPI.getParticipationToken({
      userStageId,
      displayStageId,
      participantType
    });
    if (result) {
      return result;
    }
    if (error) {
      throw redirect('/manager');
    }
  } else {
    // Host: create stage resource
    const { result, error } = await stagesAPI.createStage();
    if (result) {
      return result;
    }
    if (error) {
      throw redirect('/manager');
    }
  }
}

function channelStageLoader({ params, request }) {
  return defer({
    channelStageResponse: new Promise((resolve, reject) => {
      channelsAPI
        .getUserChannelData(params.username)
        .then((response) => {
          const {
            result: { userStageId, displayStageId } = {},
            error: getChannelDataError
          } = response;

          if (!userStageId) return resolve(null);

          if (getChannelDataError) throw getChannelDataError;

          return stagesAPI.getSpectatorToken(userStageId, displayStageId);
        })
        .then((response) => {
          const { result: stageConfig, error: getTokenError } = response;

          if (stageConfig) return resolve(stageConfig);

          if (getTokenError) throw getTokenError;
        })
        .catch(reject);
    })
  });
}

async function managerLoader({ request }) {
  const { pathname } = new URL(request.url);
  if (pathname === '/manager/collab') return {};
  const { result, error } = await channelAPI.getUserData();

  if (result) {
    const { userStageId } = result;

    if (userStageId) {
      return redirect('/manager/collab');
    } else {
      return {};
    }
  }

  if (error) return {};
}

const App = () => <RouterProvider router={router} />;

export default App;
