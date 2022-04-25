import PropTypes from 'prop-types';
import { createContext, useEffect, useMemo, useState } from 'react';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'MobileBreakpoint';

const MOBILE_BREAKPOINT = 875; // px

export const Provider = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(undefined);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const value = useMemo(() => ({ isMobileView }), [isMobileView]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useMobileBreakpoint = () => useContextHook(Context);
