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
    (message, type) => {
      let shouldDismissNotif = false;

      setNotif(
        (prevNotif) => {
          if (prevNotif && prevNotif.message !== message) {
            shouldDismissNotif = true;
            clearTimeout(timeoutID.current);
            return null;
          } else {
            return { message, type };
          }
        },
        () => {
          if (shouldDismissNotif) {
            setTimeout(
              () => setNotif({ message, type }),
              NOTIF_ANIMATION_DURATION_MS
            );
          }
        }
      );
    },
    [setNotif]
  );

  const notifyError = useCallback(
    (message) => notify(message, NOTIF_TYPES.ERROR),
    [notify]
  );

  const notifySuccess = useCallback(
    (message) => notify(message, NOTIF_TYPES.SUCCESS),
    [notify]
  );

  useEffect(() => {
    dismissNotif();
  }, [dismissNotif, pathname]);

  useEffect(() => {
    if (notif) {
      timeoutID.current = setTimeout(dismissNotif, NOTIF_TIMEOUT);
    }

    return () => clearTimeout(timeoutID.current);
  }, [dismissNotif, notif]);

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
