import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { BREAKPOINTS, USER_MANAGEMENT_THEME_COLOR } from '../../constants';
import { clsm, compose } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import FullScreenLoader from '../../components/FullScreenLoader';
import Notification from '../../components/Notification';
import useScrollToTop from '../../hooks/useScrollToTop';
import useThemeColor from '../../hooks/useThemeColor';
import withSessionLoader from '../../components/withSessionLoader';
import withVerticalScroller from '../../components/withVerticalScroller';

const UserManagement = () => {
  const {
    hasErrorProvisioningResources,
    initUserResources,
    isProvisioningResources,
    isSessionValid
  } = useUser();
  const { currentBreakpoint, mainRef } = useResponsiveDevice();
  const isResponsiveView = currentBreakpoint < BREAKPOINTS.lg;
  const location = useLocation();
  const locationRef = useRef({});
  const pathName = locationRef.current?.from?.pathname || '/';
  const searchParams = locationRef.current?.from?.search || '';
  const intendedRoute = `${pathName}${searchParams}`;

  useScrollToTop({ isResponsiveView });
  useThemeColor(USER_MANAGEMENT_THEME_COLOR);

  useEffect(() => {
    locationRef.current = location.state;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (
    isSessionValid === true &&
    !isProvisioningResources &&
    !hasErrorProvisioningResources
  ) {
    /**
     * Send the user back to the page they tried to visit when they were
     * redirected to the login page, setting replace to "true" so we don't
     * create another entry in the history stack for the login page.
     */
    return <Navigate to={intendedRoute} state={locationRef.current} replace />;
  }

  return (
    <main
      id={`main-user-container${isResponsiveView ? '' : '-scrollable'}`}
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-black',
        'flex-col',
        'flex',
        'justify-center',
        'min-h-screen',
        'overflow-x-hidden',
        'overflow-y-auto',
        'supports-overlay:overflow-y-overlay',
        'px-4',
        'py-0',
        'relative',
        'scroll-smooth',
        'w-full'
      ])}
      ref={mainRef}
    >
      <Notification />
      {isProvisioningResources || hasErrorProvisioningResources ? (
        <FullScreenLoader
          hasError={hasErrorProvisioningResources}
          mobileBreakpoint={BREAKPOINTS.lg}
          onClick={initUserResources}
        />
      ) : (
        <div
          className={clsm(
            '[&>svg]:h-8',
            '[&>svg]:w-[130px]',
            'flex-col',
            'flex',
            'items-center',
            'py-8',
            'sm:mx-auto',
            'sm:my-0',
            'space-y-8',
            'w-full'
          )}
        >
          <Outlet />
        </div>
      )}
    </main>
  );
};

const curriedWithSessionLoader = (component) =>
  withSessionLoader(component, BREAKPOINTS.lg);

export default compose(
  curriedWithSessionLoader,
  withVerticalScroller
)(UserManagement);
