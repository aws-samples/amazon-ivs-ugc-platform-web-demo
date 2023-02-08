import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { navMenuButtonData } from './utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import Button from '../Button';
import Hamburger from './Hamburger';
import ProfileMenu from '../ProfileMenu';
import useCurrentPage from '../../hooks/useCurrentPage';

const FloatingNav = ({ containerClassName }) => {
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const { isSessionValid } = useUser();

  const currentPage = useCurrentPage();
  const isStreamManagerPage = currentPage === 'stream_manager';

  return (
    isMobileView &&
    isSessionValid && (
      <ProfileMenu
        navData={navMenuButtonData}
        fadeBackground
        containerClassName={(isOpen) =>
          clsm([
            isOpen || isStreamManagerPage ? 'fixed' : 'absolute',
            'flex',
            'flex-col',
            'items-end',
            'space-y-4',
            'right-5',
            'bottom-6',
            'h-auto',
            'w-[calc(100vw_-_40px)]',
            /**
             * The container's max-height is calculated by considering the viewport height of mobile webkit browsers,
             * which define a fixed value for vh that is based on the maximum height of the screen.
             *
             * Reference: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
             */
            'max-h-[650px]', // Fallback
            'max-h-[min(650px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]', // Mobile (portrait) max-height calculation
            isLandscape && [
              'md:max-w-[400px]',
              'touch-screen-device:max-w-[400px]'
            ],
            isStreamManagerPage && [
              'bottom-12',
              'right-[52px]',
              'sm:right-9',
              'max-h-[min(650px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_72px))]',
              isLandscape && [
                'absolute',
                'sm:right-5',
                'lg:right-5',
                'bottom-6'
              ]
            ],
            containerClassName
          ])
        }
        menuClassName={clsm(
          ['w-full', 'h-full', 'origin-bottom-right'],
          isStreamManagerPage && [
            'lg:w-[calc(100vw_-_104px)]',
            'sm:w-[calc(100vw_-_72px)]',
            isLandscape && [
              'fixed',
              'max-h-[min(570px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_126px))]',
              'right-[52px]',
              'sm:right-[36px]',
              'sm:w-full',
              'max-w-[400px]',
              'bottom-[112px]',
              'sm:w-[calc(100vw_-_72px)]'
            ]
          ]
        )}
      >
        {({ isOpen, toggle, toggleRef }) => (
          <Button
            data-testid="floating-menu-toggle"
            className={clsm([
              'w-12',
              'h-12',
              'min-w-[48px]',
              'min-h-[48px]',
              'bg-lightMode-gray',
              'hover:bg-lightMode-gray-hover',
              'focus:bg-lightMode-gray'
            ])}
            onClick={() => toggle()}
            variant="secondary"
            ref={toggleRef}
          >
            <Hamburger isOpen={isOpen} />
          </Button>
        )}
      </ProfileMenu>
    )
  );
};

FloatingNav.propTypes = { containerClassName: PropTypes.string };

FloatingNav.defaultProps = { containerClassName: '' };

export default FloatingNav;
