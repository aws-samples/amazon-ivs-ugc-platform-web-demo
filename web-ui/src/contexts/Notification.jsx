import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import useContextHook from './useContextHook';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Notification';

const NOTIF_TYPES = { SUCCESS: 'success', ERROR: 'error' };
const NOTIF_TIMEOUT = 3000; // ms
export const NOTIF_ANIMATION_DURATION_MS = 250; // ms

export const Provider = ({ children }) => {
  const [notif, setNotif] = useStateWithCallback(null);

  const { pathname } = useLocation();
  const timeoutID = useRef();

  const dismissNotif = useCallback(() => {
    setNotif(null);
    clearTimeout(timeoutID.current);
  }, [setNotif]);

  const notify = useCallback(
    (message, type, withTimeout = true) => {
      let shouldDismissNotif = false;

      setNotif(
        (prevNotif) => {
          if (prevNotif && prevNotif.message !== message) {
            shouldDismissNotif = true;
            clearTimeout(timeoutID.current);

            return null;
          } else {
            return { message, type, withTimeout };
          }
        },
        () => {
          if (shouldDismissNotif) {
            if (withTimeout)
              setTimeout(
                () => setNotif({ message, type, withTimeout }),
                NOTIF_ANIMATION_DURATION_MS
              );
            else setNotif({ message, type, withTimeout });
          }
        }
      );
    },
    [setNotif]
  );

  const notifyError = useCallback(
    (message, withTimeout = true) =>
      notify(message, NOTIF_TYPES.ERROR, withTimeout),
    [notify]
  );

  const notifySuccess = useCallback(
    (message, withTimeout = true) =>
      notify(message, NOTIF_TYPES.SUCCESS, withTimeout),
    [notify]
  );

  useEffect(() => {
    dismissNotif();
  }, [dismissNotif, pathname]);

  useEffect(() => {
    if (notif && notif.withTimeout) {
      timeoutID.current = setTimeout(dismissNotif, NOTIF_TIMEOUT);
    }

    return () => clearTimeout(timeoutID.current);
  }, [dismissNotif, notif]);

  const value = useMemo(
    () => ({
      dismissNotif,
      NOTIF_TYPES,
      notif,
      notifyError,
      notifySuccess
    }),
    [dismissNotif, notif, notifyError, notifySuccess]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useNotif = () => useContextHook(Context);
