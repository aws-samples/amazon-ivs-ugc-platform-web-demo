import { Outlet } from 'react-router-dom';

import { clsm } from '../../utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useUser } from '../../contexts/User';
import FloatingNav from './FloatingNav';
import Modal from '../../components/Modal';
import Navbar from './Navbar';
import Notification from '../../components/Notification';
import useCurrentPage from '../../hooks/useCurrentPage';
import withSessionLoader from '../../components/withSessionLoader';

const AppLayoutWithNavbar = () => {
  const { isDefaultResponsiveView, isMobileView, mainRef } =
    useMobileBreakpoint();
  const { isSessionValid } = useUser();
  const { modal } = useModal();
  const currentPage = useCurrentPage();

  return (
    <div className={clsm(['relative', 'flex', 'min-h-screen'])}>
      {isSessionValid && isMobileView ? <FloatingNav /> : <Navbar />}
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
                // Autenticated Sidebar is visible
                'w-[calc(100vw_-_64px)]',
                // Autenticated Sidebar is not visible
                'md:w-screen',
                'touch-screen-device:landscape:w-screen'
              ]
            : [
                // Unautenticated Sidebar is visible
                'w-[calc(100vw_-_240px)]',
                'lg:portrait:w-[calc(100vw_-_160px)]',
                // Unautenticated MobileNavbar is visible
                'md:portrait:w-screen',
                'md:landscape:w-screen',
                'touch-screen-device:lg:landscape:w-screen'
              ]
        )}
      >
        {currentPage !== 'channel' && <Notification />}
        <Modal isOpen={!!modal} />
        <Outlet />
      </main>
    </div>
  );
};

export default withSessionLoader(AppLayoutWithNavbar);
