import { Fragment, forwardRef, useMemo } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  HAIRLINE_DIVIDER_CLASSES,
  MENU_BUTTON_CLASSES,
  MENU_BUTTON_TEXT_CLASSES
} from './ProfileMenuTheme';
import { app as $appContent } from '../../content';
import { clsm } from '../../utils';
import { Logout } from '../../assets/icons';
import { useUser } from '../../contexts/User';
import * as avatars from '../../assets/avatars';
import Button from '../Button';
import UserAvatar from '../UserAvatar';
import withPortal from '../withPortal';

const $content = $appContent.navbar;
const defaultTransition = { duration: 0.25, type: 'tween' };

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
        animate="visible"
        exit="hidden"
        initial="hidden"
        variants={{
          hidden: { opacity: 0, scale: 0.75 },
          visible: { opacity: 1, scale: 1 }
        }}
        transition={defaultTransition}
        className={clsm([
          'px-1',
          'rounded-3xl',
          'dark:bg-darkMode-gray',
          'bg-lightMode-gray-light',
          'overflow-y-auto',
          'overflow-x-hidden',
          'supports-overlay:overflow-y-overlay',
          'z-[300]',
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
            'gap-y-4',
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
                '[&>*]:hover:rounded-lg',
                '[&>*]:focus:rounded-lg'
              ],
              !hasAvatar && [
                '[&>div]:bg-lightMode-gray-light',
                '[&>div]:hover:bg-lightMode-gray-light-hover',
                'dark:[&>div]:bg-darkMode-gray',
                'dark:[&>div]:hover:bg-darkMode-gray-hover'
              ]
            )}
            to={`/${username}`}
            type="nav"
            data-test-id="profileMenu-avatar"
          >
            <UserAvatar avatarName={avatarName} profileColor={profileColor} />
            <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>
              {username || $content.profile}
            </p>
          </Button>
          <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />

          {/* CUSTOM NAVIGATION BUTTONS */}
          {navData.map(({ icon, label, to, hasDivider, pageName }) => (
            <Fragment key={label}>
              <Button
                {...commonMenuButtonProps}
                type="nav"
                to={to}
                data-test-id={`${pageName}-button`}
              >
                {icon}
                <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>{label}</p>
              </Button>
              {hasDivider && (
                <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />
              )}
            </Fragment>
          ))}

          {/* LOGOUT BUTTON */}
          <Button
            {...commonMenuButtonProps}
            onClick={() => logOut('logOut')}
            data-test-id="profileMenu-logout"
          >
            <Logout />
            <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>{$content.log_out}</p>
          </Button>
        </div>
      </m.div>
    );
  }
);

const PortalPopup = withPortal(Popup, 'profile-menu-popup');

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
