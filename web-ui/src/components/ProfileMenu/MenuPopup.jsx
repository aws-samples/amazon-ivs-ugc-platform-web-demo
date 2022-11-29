import { Fragment, forwardRef, useMemo } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  HAIRLINE_DIVIDER_CLASSES,
  MENU_BUTTON_CLASSES
} from './ProfileMenuTheme';
import { app as $appContent } from '../../content';
import { clsm } from '../../utils';
import { createAnimationProps } from '../../utils/animationPropsHelper';
import { Logout } from '../../assets/icons';
import { useUser } from '../../contexts/User';
import * as avatars from '../../assets/avatars';
import Button from '../Button';
import UserAvatar from '../UserAvatar';
import withPortal from '../withPortal';

const $content = $appContent.navbar;

const Popup = forwardRef(
  ({ navData, toggleProfileMenu, menuClassName }, ref) => {
    const { userData, logOut } = useUser();
    const {
      avatar: avatarName,
      color: profileColor,
      username
    } = userData || {};
    const hasAvatar = !!avatars[avatarName];

    const commonMenuButtonProps = useMemo(
      () => ({
        variant: 'tertiaryText',
        className: clsm(MENU_BUTTON_CLASSES),
        onClick: () => toggleProfileMenu(false)
      }),
      [toggleProfileMenu]
    );

    return (
      <m.div
        {...createAnimationProps({ animations: ['fadeIn-half', 'scale'] })}
        className={clsm([
          'px-1',
          'rounded-3xl',
          'dark:bg-darkMode-gray',
          'bg-lightMode-gray-light',
          'no-scrollbar',
          'overflow-y-auto',
          'overflow-x-hidden',
          'supports-overlay:overflow-y-overlay',
          menuClassName
        ])}
        ref={ref}
      >
        <div
          className={clsm([
            'w-full',
            'h-full',
            'px-3',
            'py-4',
            'flex',
            'flex-col',
            'space-y-4',
            'overflow-y-auto',
            'overflow-x-hidden',
            'supports-overlay:overflow-y-overlay'
          ])}
        >
          <Button
            {...commonMenuButtonProps}
            className={clsm(
              MENU_BUTTON_CLASSES,
              [
                'px-3',
                'py-2.5',
                'h-auto',
                '[&>img]:hover:rounded-lg',
                '[&>img]:focus:rounded-lg'
              ],
              !hasAvatar && [
                '[&>div]:bg-lightMode-gray-light',
                '[&>div]:hover:bg-lightMode-gray-light-hover',
                'dark:[&>div]:bg-darkMode-gray',
                'dark:[&>div]:hover:bg-darkMode-gray-hover'
              ]
            )}
            data-testid="profileMenu-avatar"
            to={`/${username}`}
            type="nav"
          >
            <UserAvatar avatarName={avatarName} profileColor={profileColor} />
            <p className="truncate">{username || $content.profile}</p>
          </Button>
          <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />

          {/* CUSTOM NAVIGATION BUTTONS */}
          {navData.map(({ icon, label, to, hasDivider, pageName }) => (
            <Fragment key={label}>
              <Button
                {...commonMenuButtonProps}
                data-testid={`${pageName}-button`}
                type="nav"
                to={to}
              >
                {icon}
                <p className="truncate">{label}</p>
              </Button>
              {hasDivider && (
                <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />
              )}
            </Fragment>
          ))}

          {/* LOGOUT BUTTON */}
          <Button {...commonMenuButtonProps} onClick={() => logOut('logOut')}>
            <Logout />
            <p className="truncate">{$content.log_out}</p>
          </Button>
        </div>
      </m.div>
    );
  }
);

const PortalPopup = withPortal(Popup, 'profile-menu-popup', {
  baseContainerClasses: clsm(['absolute', 'z-[1000]'])
});

const MenuPopup = forwardRef(
  ({ asPortal, isOpen, siblingRef, ...restProps }, ref) =>
    asPortal ? (
      <PortalPopup
        isOpen={isOpen}
        ref={ref}
        prevSiblingEl={siblingRef.current}
        {...restProps}
      />
    ) : (
      isOpen && <Popup ref={ref} {...restProps} />
    )
);

MenuPopup.defaultProps = {
  asPortal: false,
  isOpen: false,
  siblingRef: { current: null }
};

MenuPopup.propTypes = {
  asPortal: PropTypes.bool,
  isOpen: PropTypes.bool,
  siblingRef: PropTypes.object
};

Popup.defaultProps = {
  isOpen: false,
  menuClassName: '',
  navData: []
};

Popup.propTypes = {
  isOpen: PropTypes.bool,
  navData: PropTypes.array,
  menuClassName: PropTypes.string,
  toggleProfileMenu: PropTypes.func.isRequired
};

export default MenuPopup;
