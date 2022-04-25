import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { userManagement } from '../api';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'User';

export const Provider = ({ children }) => {
  const [userData, setUserData] = useState();
  const [isSessionValid, setIsSessionValid] = useState();

  const checkSession = useCallback(async () => {
    const { result: session } = await userManagement.getCurrentSession();
    setIsSessionValid(!!session);
  }, []);

  const fetchUserData = useCallback(async () => {
    await checkSession();
    const { result } = await userManagement.getUserData();
    if (result) setUserData(result);
  }, [checkSession]);

  const clearUserData = useCallback(() => setUserData(null), []);

  // Initial session check on page load
  useEffect(() => {
    checkSession();
  }, [checkSession, userData]);

  const value = useMemo(
    () => ({
      clearUserData,
      isSessionValid,
      fetchUserData,
      userData
    }),
    [clearUserData, isSessionValid, fetchUserData, userData]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useUser = () => useContextHook(Context);
