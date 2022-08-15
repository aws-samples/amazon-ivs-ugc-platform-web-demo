import PropTypes from 'prop-types';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useLocation } from 'react-router-dom';
import { m } from 'framer-motion';

import { app as $appContent } from '../../../content';
import {
  HAIRLINE_DIVIDER_CLASSES,
  MENU_BUTTON_CLASSES,
  MENU_BUTTON_TEXT_CLASSES
} from './ProfileMenuTheme';
import { clsm } from '../../../utils';
import { Logout } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import * as avatars from '../../../assets/avatars';
import Button from '../../../components/Button';
import useClickAway from '../../../hooks/useClickAway';

const $content = $appContent.navbar;

const ProfileMenu = ({
  children: ToggleBtn,
  navData,
  containerClassName,
  menuClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { userData, logOut } = useUser();
  const { avatar: avatarName, color: profileColor, username } = userData || {};
  const profileMenuRef = useRef();
  const toggleRef = useRef();

  const toggleProfileMenu = useCallback(
    (value) =>
      setIsOpen((prevIsPopupMenuOpen) =>
        value !== undefined ? value : !prevIsPopupMenuOpen
      ),
    [setIsOpen]
  );

  const commonMenuButtonProps = useMemo(
    () => ({
      variant: 'tertiaryText',
      className: clsm(MENU_BUTTON_CLASSES),
      onClick: () => toggleProfileMenu(false)
    }),
    [toggleProfileMenu]
  );

  useClickAway([profileMenuRef, toggleRef], () => toggleProfileMenu(false));

  useEffect(() => toggleProfileMenu(false), [pathname, toggleProfileMenu]);

  return (
    <div className={clsm(['z-[500]', isOpen && containerClassName])}>
      {ToggleBtn({ isOpen, toggle: toggleProfileMenu, toggleRef })}
      {isOpen && (
        // POPUP MENU LAYOUT WRAPPER
        <m.div
          animate="visible"
          exit="hidden"
          initial="hidden"
          variants={{
            hidden: { opacity: 0, scale: 0.75 },
            visible: { opacity: 1, scale: 1 }
          }}
          transition={{ duration: 0.25, type: 'tween' }}
          className={clsm([
            'px-1',
            'rounded-3xl',
            'dark:bg-darkMode-gray',
            'bg-lightMode-gray-light',
            'overflow-y-auto',
            'overflow-x-hidden',
            'supports-overlay:overflow-y-overlay',
            isOpen && menuClassName
          ])}
          ref={profileMenuRef}
        >
          {/* POPUP MENU */}
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
              className={clsm(MENU_BUTTON_CLASSES, [
                'px-3',
                'py-2.5',
                'h-auto',
                '[&>img]:hover:rounded-lg',
                '[&>img]:focus:rounded-lg'
              ])}
              to={`/${username}`}
              type="nav"
            >
              <img
                className={clsm(
                  [
                    'w-11',
                    'h-11',
                    'border-2',
                    'rounded-[22px]',
                    'transition-all',
                    'bg-lightMode-gray-extraLight',
                    'dark:bg-darkMode-gray-medium'
                  ],
                  profileColor
                    ? `border-profile-${profileColor}`
                    : 'border-profile'
                )}
                src={avatars[avatarName]}
                alt={`${avatarName || 'Profile'} avatar`}
                draggable={false}
              />
              <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>
                {username &&
                  username.charAt(0).toUpperCase() + username.slice(1)}
              </p>
            </Button>
            <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />

            {/* CUSTOM NAVIGATION BUTTONS */}
            {navData.map(({ icon, label, to, hasDivider }) => (
              <Fragment key={label}>
                <Button {...commonMenuButtonProps} type="nav" to={to}>
                  {icon}
                  <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>{label}</p>
                </Button>
                {hasDivider && (
                  <span className={clsm(HAIRLINE_DIVIDER_CLASSES)} />
                )}
              </Fragment>
            ))}

            {/* LOGOUT BUTTON */}
            <Button {...commonMenuButtonProps} onClick={() => logOut('logOut')}>
              <Logout />
              <p className={clsm(MENU_BUTTON_TEXT_CLASSES)}>
                {$content.log_out}
              </p>
            </Button>
          </div>
        </m.div>
      )}
    </div>
  );
};

ProfileMenu.defaultProps = {
  containerClassName: undefined,
  menuClassName: undefined,
  navData: []
};

ProfileMenu.propTypes = {
  children: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
  menuClassName: PropTypes.string,
  navData: PropTypes.array
};

export default ProfileMenu;
