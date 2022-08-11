import { Fragment } from 'react';

import { AcmeSml, AcmeLrg } from '../../../assets/icons';
import { app as $appContent } from '../../../content';
import { clsm } from '../../../utils';
import { navPageData } from './utils';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import ProfileNav from './ProfileNav';
import Tooltip from '../../../components/Tooltip';
import useCurrentPage from '../../../hooks/useCurrentPage';
import './Navbar.css';

const $content = $appContent.navbar;

const Sidebar = () => {
  const { isSessionValid } = useUser();
  const currentPage = useCurrentPage();

  const renderWithTooltip = (component, message) =>
    isSessionValid ? (
      <Tooltip translate={{ x: 12 }} position="right" message={message}>
        {component}
      </Tooltip>
    ) : (
      component
    );

  return (
    <nav
      className={clsm(
        [
          'absolute',
          'flex',
          'flex-col',
          'items-center',
          'justify-between',
          'h-auto',
          'top-0',
          'bottom-0',
          'left-0',
          'w-16',
          'pt-7',
          'pb-4',
          'overflow-auto',
          'dark:bg-darkMode-gray-medium',
          'bg-lightMode-gray-extraLight',
          'supports-overlay:overflow-overlay',

          // Temporary classes for responsiveness
          'sidebar',
          isSessionValid ? 'auth' : 'unauth'
        ], // Default styles
        isSessionValid
          ? ['w-16', 'pt-7', 'pb-4', 'px-2.5'] // Authenticated
          : ['w-60', 'pt-10', 'pb-6', 'px-4'] // Unauthenticated
      )}
    >
      {isSessionValid ? (
        <AcmeSml
          className={clsm(['fill-darkMode-gray-light', 'flex-shrink-0'])}
        />
      ) : (
        <AcmeLrg
          className={clsm([
            'fill-darkMode-gray-light',
            'h-6',
            'w-24',
            'min-h-[24px]',
            'min-w-[96px]'
          ])}
        />
      )}
      <div
        className={clsm([
          'flex',
          'flex-col',
          'items-center',
          'py-6',
          'gap-y-6',
          'w-full'
        ])}
      >
        {navPageData.map(
          ({ pageName, displayName, icon, route, isAuth }, i) => {
            const isActive = pageName === currentPage;
            const isVisible = isAuth ? isSessionValid : true;

            return (
              isVisible && (
                <Fragment key={displayName}>
                  {renderWithTooltip(
                    <Button
                      ariaLabel={`Go to the ${displayName} page`}
                      type="nav"
                      to={route}
                      variant="tertiaryText"
                      className={clsm(
                        ['w-auto', 'min-w-full', 'py-1.5'], // Default styles
                        isSessionValid ? 'px-1.5' : 'px-3'
                      )}
                    >
                      <span
                        className={clsm(
                          ['flex', 'items-center', 'gap-x-3'],
                          isActive
                            ? [
                                'text-darkMode-blue',
                                '[&>svg]:fill-darkMode-blue'
                              ]
                            : [
                                'text-black',
                                'dark:text-white',
                                'dark:[&>svg]:fill-white',
                                '[&>svg]:fill-black'
                              ]
                        )}
                      >
                        {icon} {!isSessionValid && displayName}
                      </span>
                    </Button>,
                    displayName
                  )}
                  {i === 2 && (
                    <span
                      className={clsm([
                        'w-8',
                        'h-0.5',
                        'rounded',
                        'bg-lightMode-gray-extraLight-hover',
                        'dark:bg-darkMode-gray-medium-hover'
                      ])}
                    />
                  )}
                </Fragment>
              )
            );
          }
        )}
      </div>
      {isSessionValid ? (
        <ProfileNav />
      ) : (
        <div
          className={clsm([
            'flex',
            'flex-col',
            'gap-y-4',
            'w-full',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium',
            '[&>a]:w-full',
            '[&>a]:flex-1',

            // Unauthenticated MobileNavbar Styles
            'md:rounded-[40px]',
            'md:flex-row',
            'md:gap-x-4',
            'md:py-3.5',
            'md:px-4',
            'touch-screen-device:lg:landscape:rounded-[40px]',
            'touch-screen-device:lg:landscape:flex-row',
            'touch-screen-device:lg:landscape:gap-x-4',
            'touch-screen-device:lg:landscape:py-3.5',
            'touch-screen-device:lg:landscape:px-4'
          ])}
        >
          <Button type="nav" variant="secondary" to="/login">
            {$content.log_in}
          </Button>
          <Button type="nav" variant="primary" to="/register">
            {$content.sign_up}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
