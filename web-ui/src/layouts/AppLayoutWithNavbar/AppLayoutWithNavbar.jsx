import { Outlet } from 'react-router-dom';

import { clsm } from '../../utils';
import { FLOATING_PLAYER_PAGES } from '../../constants';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import ConfirmationModal from '../../components/ConfirmationModal';
import FloatingNav from '../../components/FloatingNav';
import FloatingPlayer from '../../pages/StreamHealth/FloatingPlayer';
import Navbar from './Navbar';
import Notification from '../../components/Notification';
import useCurrentPage from '../../hooks/useCurrentPage';
import withSessionLoader from '../../components/withSessionLoader';

const AppLayoutWithNavbar = () => {
  const { isDefaultResponsiveView, isLandscape, isMobileView, mainRef } =
    useResponsiveDevice();
  const { isSessionValid } = useUser();
  const currentPage = useCurrentPage();
  const shouldRenderFloatingPlayer =
    !isMobileView && FLOATING_PLAYER_PAGES.includes(currentPage);

  const renderNav = () => {
    switch (true) {
      case isMobileView &&
        (currentPage === 'channel' || currentPage === 'stream_manager'):
        return null; // The mobile channel and stream manager pages have their own FloatingNav and/or MobileNavbar
      case isMobileView && isSessionValid:
        return <FloatingNav />;
      default:
        return <Navbar />;
    }
  };

  return (
    <div className={clsm(['relative', 'flex', 'min-h-screen'])}>
      {renderNav()}
      <main
        ref={mainRef}
        id={`main-app-container${isDefaultResponsiveView ? '' : '-scrollable'}`}
        className={clsm(
          [
            'absolute',
            'dark:bg-black',
            'bg-white',
            'overflow-auto',
            'right-0',
            'scroll-smooth',
            'supports-overlay:overflow-overlay'
          ],
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
        {currentPage !== 'channel' && <Notification />}
        {shouldRenderFloatingPlayer && <FloatingPlayer />}
        <ConfirmationModal />
        <Outlet />
      </main>
    </div>
  );
};

export default withSessionLoader(AppLayoutWithNavbar);
