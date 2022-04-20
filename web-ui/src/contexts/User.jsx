import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo, useState } from 'react';

import { userManagement } from '../api';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'User';

export const Provider = ({ children }) => {
  const [userData, setUserData] = useState();

  const updateUserData = useCallback(async () => {
    const { result } = await userManagement.getUserData();

    if (result) {
      setUserData(result);
    }
  }, []);

  const value = useMemo(
    () => ({ userData, updateUserData }),
    [userData, updateUserData]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useUser = () => useContextHook(Context);
