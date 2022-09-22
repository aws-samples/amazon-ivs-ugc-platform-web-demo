import PropTypes from 'prop-types';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';

import { clsm } from '../../utils';
import MenuPopup from './MenuPopup';
import useClickAway from '../../hooks/useClickAway';

const defaultTransition = { duration: 0.25, type: 'tween' };

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
    <>
      <div className={clsm(['z-[300]', isOpen && containerClassName])}>
        <MenuPopup
          asPortal={asPortal}
          isOpen={isOpen}
          menuClassName={menuClassName}
          navData={navData}
          ref={profileMenuRef}
          siblingRef={siblingRef}
          toggleProfileMenu={toggleProfileMenu}
        />
        {ToggleBtn({ isOpen, toggle: toggleProfileMenu, toggleRef })}
      </div>
      <AnimatePresence>
        {fadeBackground && isOpen && (
          <m.div
            className={clsm([
              'fixed',
              'top-0',
              'left-0',
              'w-screen',
              'h-screen',
              'bg-modalOverlay',
              'z-[299]'
            ])}
            animate="visible"
            exit="hidden"
            initial="hidden"
            transition={defaultTransition}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          ></m.div>
        )}
      </AnimatePresence>
    </>
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
