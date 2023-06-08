import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import MenuPopup from './MenuPopup';
import useClickAway from '../../hooks/useClickAway';

const ProfileMenu = ({
  asPortal,
  children: ToggleBtn,
  containerClassName,
  fadeBackground,
  menuClassName,
  navData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { isMobileView, isLandscape, setIsProfileMenuOpen } =
    useResponsiveDevice();
  const profileMenuRef = useRef();
  const toggleRef = useRef();

  useEffect(() => {
    setIsProfileMenuOpen(isOpen);
  }, [isOpen, setIsProfileMenuOpen]);

  const toggleProfileMenu = useCallback(
    (value) =>
      setIsOpen((prevIsPopupMenuOpen) =>
        value !== undefined ? value : !prevIsPopupMenuOpen
      ),
    [setIsOpen]
  );

  useClickAway([profileMenuRef, toggleRef], () => toggleProfileMenu(false));

  useEffect(() => toggleProfileMenu(false), [pathname, toggleProfileMenu]);

  useEffect(() => {
    isMobileView && toggleProfileMenu(false);
  }, [isMobileView, isLandscape, toggleProfileMenu]);

  return (
    <div
      className={clsm([
        typeof containerClassName === 'function'
          ? containerClassName(isOpen)
          : containerClassName,
        isOpen ? 'z-[1000]' : 'w-auto'
      ])}
    >
      <AnimatePresence>
        {fadeBackground && isOpen && (
          <motion.div
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
          />
        )}
      </AnimatePresence>
      <MenuPopup
        asPortal={asPortal}
        isOpen={isOpen}
        menuClassName={clsm([
          'z-0',
          typeof menuClassName === 'function'
            ? menuClassName(isOpen)
            : menuClassName
        ])}
        navData={navData}
        ref={profileMenuRef}
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
  navData: []
};

ProfileMenu.propTypes = {
  asPortal: PropTypes.bool,
  children: PropTypes.func.isRequired,
  containerClassName: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  fadeBackground: PropTypes.bool,
  menuClassName: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  navData: PropTypes.array
};

export default ProfileMenu;
