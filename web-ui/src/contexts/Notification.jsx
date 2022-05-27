import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useLocation } from 'react-router-dom';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'Notification';

const NOTIF_TYPES = { SUCCESS: 'success', ERROR: 'error' };
const NOTIF_TIMEOUT = 5000; // ms

export const Provider = ({ children }) => {
  const [notif, setNotif] = useState(null);
  const { pathname } = useLocation();
  const timeoutID = useRef();

  const notifyError = useCallback((message) => {
    setNotif({ message, type: NOTIF_TYPES.ERROR });
  }, []);

  const notifySuccess = useCallback((message) => {
    setNotif({ message, type: NOTIF_TYPES.SUCCESS });
  }, []);

  useEffect(() => {
    clearTimeout(timeoutID.current);
    setNotif(null);
  }, [pathname]);

  useEffect(() => {
    if (notif) {
      timeoutID.current = setTimeout(() => setNotif(null), NOTIF_TIMEOUT);
    }

    return () => clearTimeout(timeoutID.current);
  }, [notif]);

  const value = useMemo(
    () => ({
      NOTIF_TYPES,
      notif,
      notifyError,
      notifySuccess
    }),
    [notif, notifyError, notifySuccess]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useNotif = () => useContextHook(Context);
