import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'Notification';

const NOTIF_TYPES = { SUCCESS: 'success', ERROR: 'error' };
const NOTIF_TIMEOUT = 5000; // ms

export const Provider = ({ children }) => {
  const [notif, setNotif] = useState(null);
  const timeoutID = useRef();

  const notify = useCallback(
    (message, type) => setNotif({ message, type }),
    []
  );

  useEffect(() => {
    if (notif) {
      timeoutID.current = setTimeout(() => setNotif(null), NOTIF_TIMEOUT);
    }

    return () => clearTimeout(timeoutID.current);
  }, [notif]);

  /**
   *
   */
  const value = useMemo(
    () => ({
      NOTIF_TYPES,
      notif,
      notifyError: (message) => notify(message, NOTIF_TYPES.ERROR),
      notifySuccess: (message) => notify(message, NOTIF_TYPES.SUCCESS)
    }),
    [notif, notify]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useNotif = () => useContextHook(Context);
