import { clsm } from '../../utils';
import { navMenuButtonData } from './utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../Button';
import Hamburger from './Hamburger';
import ProfileMenu from '../ProfileMenu';

const FloatingNav = () => {
  const { isLandscape } = useResponsiveDevice();

  return (
    <div
      className={clsm([
        'fixed',
        'flex',
        'flex-col-reverse',
        'right-5',
        'bottom-6',
        'z-[500]'
      ])}
    >
      <ProfileMenu
        navData={navMenuButtonData}
        fadeBackground
        containerClassName={clsm([
          'o-4',
          'flex',
          'flex-col',
          'items-end',
          'w-[calc(100vw_-_40px)]',
          'h-[calc(100vh_-_40px)]',
          isLandscape && [
            'md:max-w-[400px]',
            'touch-screen-device:max-w-[400px]',
            'touch-screen-device:lg:max-h-[570px]', // Fallback
            'touch-screen-device:lg:max-h-[min(570px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]' // Mobile (landscape) max-height calculation
          ],
          /**
           * The container's max-height is calculated by considering the viewport height of mobile webkit browsers,
           * which define a fixed value for vh that is based on the maximum height of the screen.
           *
           * Reference: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
           */
          'max-h-[634px]', // Fallback
          'max-h-[min(634px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]' // Mobile (portrait) max-height calculation
        ])}
        menuClassName={clsm(['w-full', 'h-full', 'origin-bottom-right'])}
      >
        {({ isOpen, toggle, toggleRef }) => (
          <Button
            data-test-id="floating-menu-toggle"
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
    </div>
  );
};

export default FloatingNav;
