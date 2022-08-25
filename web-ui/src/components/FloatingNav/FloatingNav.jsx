import { clsm } from '../../utils';
import { navMenuButtonData } from './utils';
import { SHOW_WIP_PAGES } from '../../constants';
import Button from '../Button';
import Hamburger from './Hamburger';
import ProfileMenu from '../ProfileMenu';

const FloatingNav = () => (
  <div
    className={clsm([
      'fixed',
      'flex',
      'flex-col-reverse',
      'right-5',
      'bottom-6',
      'z-[300]'
    ])}
  >
    <ProfileMenu
      navData={navMenuButtonData}
      fadeBackground
      containerClassName={clsm([
        'flex',
        'flex-col-reverse',
        'items-end',
        'gap-x-4',
        'gap-y-4',
        'w-[calc(100vw_-_40px)]',
        'h-[calc(100vh_-_40px)]',
        'md:landscape:max-w-[400px]',
        'touch-screen-device:landscape:max-w-[400px]',

        /**
         * The container's max-height is calculated by considering the viewport height of mobile webkit browsers,
         * which define a fixed value for vh that is based on the maximum height of the screen.
         *
         * Reference: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
         */
        SHOW_WIP_PAGES
          ? [
              'max-h-[634px]', // Fallback
              'max-h-[min(634px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]', // Mobile (portrait) max-height calculation
              'touch-screen-device:lg:landscape:max-h-[570px]', // Fallback
              'touch-screen-device:lg:landscape:max-h-[min(570px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]' // Mobile (landscape) max-height calculation
            ]
          : [
              // Same as above but with different pixel values
              'max-h-[496px]',
              'max-h-[min(496px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]',
              'touch-screen-device:lg:landscape:max-h-[432px]',
              'touch-screen-device:lg:landscape:max-h-[min(432px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px))]'
            ]
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
            'bg-lightMode-gray-light',
            'hover:bg-lightMode-gray-hover',
            'focus:bg-lightMode-gray-light'
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

export default FloatingNav;
