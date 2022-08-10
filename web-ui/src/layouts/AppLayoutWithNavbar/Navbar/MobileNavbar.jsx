import clsx from 'clsx';

import { app as $appContent } from '../../../content';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import './Navbar.css';

const $content = $appContent.navbar;

const MobileNavbar = () => {
  const { isSessionValid } = useUser();

  return (
    !isSessionValid && (
      <nav
        className={clsx([
          'fixed',
          'flex',
          'items-center',
          'justify-between',
          'bottom-0',
          'left-1/2',
          'w-full',
          'z-10',
          'py-[20px]',
          'px-[16px]',
          'max-w-[calc(440px_+_32px)]',
          'min-w-[calc(228px_+_32px)]',
          '-translate-x-1/2',

          'mobile-navbar' // TEMPORARY class for responsiveness
        ])}
      >
        <div
          className={clsx([
            'flex',
            'gap-y-[16px]',
            'w-full',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium',
            '[&>a]:w-full',
            '[&>a]:flex-1',

            'sidebar-user-buttons' // TEMPORARY class for responsiveness
          ])}
        >
          <Button type="nav" variant="secondary" to="/login">
            {$content.log_in}
          </Button>
          <Button type="nav" variant="primary" to="/register">
            {$content.sign_up}
          </Button>
        </div>
      </nav>
    )
  );
};

export default MobileNavbar;
