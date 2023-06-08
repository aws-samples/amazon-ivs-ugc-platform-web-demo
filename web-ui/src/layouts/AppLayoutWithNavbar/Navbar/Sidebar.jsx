import { Fragment } from 'react';

import { AcmeSml, AcmeLrg, Settings } from '../../../assets/icons';
import { app as $appContent } from '../../../content';
import { clsm } from '../../../utils';
import { navPageData } from './utils';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';
import useCurrentPage from '../../../hooks/useCurrentPage';
import ProfileMenu from '../../../components/ProfileMenu';

const $content = $appContent.navbar;

const Sidebar = () => {
  const { userData, isSessionValid } = useUser();
  const { avatar: avatarName, avatarSrc } = userData || {};
  const currentPage = useCurrentPage();
  const hasAvatar = !!avatarSrc;

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
          'fixed',
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
          'overflow-y-auto',
          'overflow-x-hidden',
          'dark:bg-darkMode-gray-medium',
          'bg-lightMode-gray-extraLight',
          'supports-overlay:overflow-y-overlay'
        ], // Default styles
        isSessionValid
          ? ['w-16', 'pt-7', 'pb-4', 'px-2.5'] // Authenticated
          : ['w-60', 'pt-10', 'pb-6', 'px-4', 'lg:portrait:w-40'] // Unauthenticated
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
          'space-y-6',
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
                      data-testid={`${pageName}-button`}
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
                          ['flex', 'items-center', 'space-x-3'],
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
                        {icon} {!isSessionValid && <span>{displayName}</span>}
                      </span>
                    </Button>,
                    displayName
                  )}
                  {isSessionValid && i === 1 && (
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
        <ProfileMenu
          asPortal
          menuClassName={clsm([
            'fixed',
            'bottom-6',
            'left-6',
            'w-[236px]',
            'origin-bottom-left'
          ])}
          navData={[
            { label: $content.settings, icon: <Settings />, to: '/settings' }
          ]}
        >
          {({ isOpen, toggle, toggleRef }) => (
            <Button
              ariaLabel={`${isOpen ? 'Close' : 'Open'} navigation menu`}
              className={clsm(
                [
                  'bg-lightMode-gray-light',
                  'dark:bg-darkMode-gray',
                  'dark:shadow-white',
                  'focus:shadow-focusOuter',
                  'h-8',
                  'hover:shadow-hoverOuter',
                  'p-0',
                  'shadow-black',
                  'w-8'
                ],
                isOpen && 'shadow-focusOuter',
                !hasAvatar && [
                  'dark:hover:bg-darkMode-gray-hover',
                  'hover:bg-lightMode-gray-light-hover'
                ]
              )}
              data-testid="sidebar-avatar"
              onClick={() => toggle()}
              variant="icon"
              ref={toggleRef}
            >
              {hasAvatar && (
                <img
                  className="rounded-full"
                  src={avatarSrc}
                  alt={`${avatarName || 'Profile'} avatar`}
                  draggable={false}
                />
              )}
            </Button>
          )}
        </ProfileMenu>
      ) : (
        <div
          className={clsm([
            'flex',
            'flex-col',
            'space-y-4',
            'w-full',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium',
            '[&>a]:w-full',
            '[&>a]:flex-1'
          ])}
        >
          <Button
            type="nav"
            variant="secondary"
            to="/login"
            saveLocationFromState
          >
            {$content.log_in}
          </Button>
          <Button
            type="nav"
            variant="primary"
            to="/register"
            saveLocationFromState
          >
            {$content.sign_up}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
