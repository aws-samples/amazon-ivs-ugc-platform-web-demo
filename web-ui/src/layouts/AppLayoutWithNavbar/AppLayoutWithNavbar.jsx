import { Outlet } from 'react-router-dom';

import { clsm } from '../../utils';
import { FLOATING_PLAYER_PAGES } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import ConfirmationModal from '../../components/ConfirmationModal';
import FloatingNav from '../../components/FloatingNav';
import FloatingPlayer from '../../components/FloatingPlayer';
import Navbar from './Navbar';
import Notification from '../../components/Notification';
import useCurrentPage from '../../hooks/useCurrentPage';
import withSessionLoader from '../../components/withSessionLoader';

const AppLayoutWithNavbar = () => {
  const {
    isDefaultResponsiveView,
    isLandscape,
    isMobileView,
    mainRef,
    isTouchscreenDevice
  } = useResponsiveDevice();
  const { isSessionValid } = useUser();
  const currentPage = useCurrentPage();
  const isChannelPage = currentPage === 'channel';
  const isStreamManagerPage = currentPage === 'stream_manager';
  const isStreamHealthPage = currentPage === 'stream_health';
  const shouldRenderFloatingPlayer =
    !isMobileView && FLOATING_PLAYER_PAGES.includes(currentPage);

  const renderNav = () => {
    switch (true) {
      case isMobileView && (isChannelPage || isStreamManagerPage):
        return null; // The mobile channel and stream manager pages have their own FloatingNav and/or MobileNavbar
      case isMobileView && isSessionValid:
        return <FloatingNav />;
      default:
        return <Navbar />;
    }
  };

  return (
    <div
      className={clsm([
        'flex',
        'min-h-screen',
        'overflow-auto',
        'relative',
        'scroll-smooth',
        'supports-overlay:overflow-overlay',
        isChannelPage && !isTouchscreenDevice && 'lg:no-scrollbar'
      ])}
    >
      <main
        ref={mainRef}
        id={`main-app-container${isDefaultResponsiveView ? '' : '-scrollable'}`}
        className={clsm(
          ['absolute', 'dark:bg-black', 'bg-white', 'right-0'],
          isSessionValid
            ? [
                // Authenticated Sidebar is visible
                'w-[calc(100vw_-_64px)]',
                // Authenticated Sidebar is not visible
                'md:w-screen',
                isLandscape && 'touch-screen-device:lg:w-screen'
              ]
            : [
                // Unauthenticated Sidebar is visible
                'w-[calc(100vw_-_240px)]',
                'lg:portrait:w-[calc(100vw_-_160px)]',
                // Unauthenticated MobileNavbar is visible
                'md:portrait:w-screen',
                isLandscape && [
                  'md:w-screen',
                  'touch-screen-device:lg:w-screen'
                ]
              ]
        )}
      >
        <ConfirmationModal />
        {!isChannelPage && (
          <Notification
            {...(isStreamHealthPage ? { className: 'top-24' } : {})}
          />
        )}
        {shouldRenderFloatingPlayer && <FloatingPlayer />}
        <Outlet />
      </main>
      {renderNav()}
    </div>
  );
};

export default withSessionLoader(AppLayoutWithNavbar);
