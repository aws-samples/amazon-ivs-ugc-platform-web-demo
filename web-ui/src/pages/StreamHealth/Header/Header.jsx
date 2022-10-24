import { forwardRef, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import SessionNavigator from './SessionNavigator';

const Header = forwardRef(({ isNavOpen, toggleNavPopup }, ref) => {
  const { isMobileView } = useResponsiveDevice();
  const headerRef = useRef();
  const navButtonRef = useRef();

  useImperativeHandle(ref, () => ({
    get headerRef() {
      return headerRef;
    },
    get navButtonRef() {
      return navButtonRef;
    }
  }));

  return (
    <header
      className={clsm([
        'bg-white',
        'dark:bg-black',
        'space-x-4',
        'grid-cols-[1fr_minmax(auto,654px)_1fr]',
        'grid',
        'h-16',
        'md:grid-cols-[1fr_minmax(auto,468px)_1fr]',
        'relative',
        'top-0',
        'w-[calc(100vw-64px)]',
        'z-[600]',
        isMobileView && 'w-screen'
      ])}
      id="stream-health-header"
      ref={headerRef}
    >
      <SessionNavigator
        ref={navButtonRef}
        isNavOpen={isNavOpen}
        toggleNavPopup={toggleNavPopup}
      />
    </header>
  );
});

Header.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

Header.defaultProps = { isNavOpen: false };

export default Header;
