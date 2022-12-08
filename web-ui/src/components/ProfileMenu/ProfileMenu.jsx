import { AnimatePresence, m } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import MenuPopup from './MenuPopup';
import useClickAway from '../../hooks/useClickAway';

const ProfileMenu = ({
  asPortal,
  children: ToggleBtn,
  containerClassName,
  fadeBackground,
  menuClassName,
  navData,
  siblingRef
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const profileMenuRef = useRef();
  const toggleRef = useRef();

  const toggleProfileMenu = useCallback(
    (value) =>
      setIsOpen((prevIsPopupMenuOpen) =>
        value !== undefined ? value : !prevIsPopupMenuOpen
      ),
    [setIsOpen]
  );

  useClickAway([profileMenuRef, toggleRef], () => toggleProfileMenu(false));

  useEffect(() => toggleProfileMenu(false), [pathname, toggleProfileMenu]);

  return (
    <div className={clsm([containerClassName, isOpen ? 'z-[1000]' : 'w-auto'])}>
      <AnimatePresence>
        {fadeBackground && isOpen && (
          <m.div
            {...createAnimationProps({ animations: ['fadeIn-half'] })}
            className={clsm([
              'fixed',
              'top-0',
              'left-0',
              '!m-0',
              'w-screen',
              'h-screen',
              'bg-modalOverlay'
            ])}
          ></m.div>
        )}
      </AnimatePresence>
      <MenuPopup
        asPortal={asPortal}
        isOpen={isOpen}
        menuClassName={clsm(['z-0', menuClassName])}
        navData={navData}
        ref={profileMenuRef}
        siblingRef={siblingRef}
        toggleProfileMenu={toggleProfileMenu}
      />
      <div className="z-0">
        {ToggleBtn({ isOpen, toggle: toggleProfileMenu, toggleRef })}
      </div>
    </div>
  );
};

ProfileMenu.defaultProps = {
  asPortal: false,
  containerClassName: undefined,
  fadeBackground: false,
  menuClassName: undefined,
  navData: [],
  siblingRef: null
};

ProfileMenu.propTypes = {
  asPortal: PropTypes.bool,
  children: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
  fadeBackground: PropTypes.bool,
  menuClassName: PropTypes.string,
  navData: PropTypes.array,
  siblingRef: PropTypes.object
};

export default ProfileMenu;
