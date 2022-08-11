import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { clsm } from '../../../../utils';
import { useUser } from '../../../../contexts/User';
import * as avatars from '../../../../assets/avatars';
import Button from '../../../../components/Button';
import PopupMenu from './PopupMenu';
import useClickAway from '../../../../hooks/useClickAway';

const ProfileNav = () => {
  const [isPopupMenuOpen, setIsPopupMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { userData, isSessionValid } = useUser();
  const { avatar: avatarName } = userData || {};
  const popupMenuRef = useRef();
  const profileNavRef = useRef();

  const togglePopupMenu = useCallback(
    (value) =>
      setIsPopupMenuOpen((prevIsPopupMenuOpen) =>
        value !== undefined ? value : !prevIsPopupMenuOpen
      ),
    []
  );

  useClickAway(
    [profileNavRef, popupMenuRef],
    () => togglePopupMenu(false),
    isPopupMenuOpen
  );

  useEffect(() => {
    togglePopupMenu(false);
  }, [pathname, togglePopupMenu]);

  return (
    isSessionValid && (
      <>
        <Button
          ref={profileNavRef}
          ariaLabel={`${isPopupMenuOpen ? 'Close' : 'Open'} navigation menu`}
          onClick={() => togglePopupMenu()}
          variant="icon"
          className={clsm([
            'p-0',
            'h-8',
            'w-8',
            'shadow-black',
            'dark:shadow-white',
            'focus:shadow-focusOuter',
            'hover:shadow-hoverOuter'
          ])}
        >
          {!!avatars[avatarName] && (
            <img
              className={clsm(
                [
                  'rounded-full',
                  'bg-lightMode-gray-extraLight',
                  'dark:bg-darkMode-gray-medium'
                ],
                isPopupMenuOpen && 'shadow-focusOuter'
              )}
              src={avatars[avatarName]}
              alt={`${avatarName || 'Profile'} avatar`}
              draggable={false}
            />
          )}
        </Button>
        <PopupMenu
          isOpen={isPopupMenuOpen}
          togglePopupMenu={togglePopupMenu}
          ref={popupMenuRef}
        />
      </>
    )
  );
};

export default ProfileNav;
