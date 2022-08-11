import PropTypes from 'prop-types';
import { forwardRef, useMemo } from 'react';
import { m } from 'framer-motion';

import { app as $appContent } from '../../../../content';
import { clsm } from '../../../../utils';
import { Settings, Logout } from '../../../../assets/icons';
import { useUser } from '../../../../contexts/User';
import * as avatars from '../../../../assets/avatars';
import Button from '../../../../components/Button';
import withPortal from '../../../../components/withPortal';

const $content = $appContent.navbar;

const PopupMenu = forwardRef(({ togglePopupMenu }, ref) => {
  const { userData, logOut } = useUser();
  const { avatar: avatarName, color: profileColor, username } = userData || {};

  const commonMenuButtonProps = useMemo(
    () => ({
      variant: 'tertiaryText',
      className: clsm([
        'px-3',
        'py-1.5',
        'w-[204px]',
        'text-black',
        'dark:text-white',
        'dark:hover:bg-darkMode-gray-hover',
        '[&>svg]:w-6',
        '[&>svg]:h-6'
      ]),
      onClick: () => togglePopupMenu(false)
    }),
    [togglePopupMenu]
  );

  return (
    <m.div
      animate="visible"
      exit="hidden"
      initial="hidden"
      variants={{
        hidden: { opacity: 0, scale: 0, x: -100, y: 100 },
        visible: { opacity: 1, scale: 1, x: 0, y: 0 }
      }}
      transition={{ duration: 0.25, type: 'tween' }}
      ref={ref}
      className={clsm([
        'absolute',
        'p-4',
        'left-6',
        'bottom-6',
        'dark:bg-darkMode-gray',
        'bg-lightMode-gray-light',
        'rounded-3xl',
        'flex',
        'flex-col',
        'gap-y-4',
        'z-10'
      ])}
    >
      <Button
        {...commonMenuButtonProps}
        className={clsm(commonMenuButtonProps.className, [
          'px-3',
          'py-2.5',
          'h-auto',
          '[&>img]:hover:rounded-lg',
          '[&>img]:focus:rounded-lg'
        ])}
        type="nav"
        to={`/${username}`}
      >
        <img
          className={clsm([
            'rounded-[22px]',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray-medium',
            'w-11',
            'h-11',
            'border-2',
            'transition-all',
            profileColor ? `border-profile-${profileColor}` : 'border-profile'
          ])}
          src={avatars[avatarName]}
          alt={`${avatarName || 'Profile'} avatar`}
          draggable={false}
        />
        {username && username.charAt(0).toUpperCase() + username.slice(1)}
      </Button>
      <span
        className={clsm([
          'w-full',
          'h-0.5',
          'rounded',
          'bg-lightMode-gray-light-hover',
          'dark:bg-darkMode-gray-hover'
        ])}
      />
      <Button {...commonMenuButtonProps} type="nav" to="/settings">
        <Settings /> {$content.settings}
      </Button>
      <Button {...commonMenuButtonProps} onClick={() => logOut('logOut')}>
        <Logout /> {$content.log_out}
      </Button>
    </m.div>
  );
});

PopupMenu.propTypes = {
  togglePopupMenu: PropTypes.func.isRequired
};

export default withPortal(PopupMenu, 'popup-menu', true, ['relative']);
