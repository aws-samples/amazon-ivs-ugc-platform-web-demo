import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';

import useContextHook from './useContextHook';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Notification';

const NOTIF_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};
const DEFAULT_NOTIF_TIMEOUT = 3000; // ms

export const NOTIF_ANIMATION_DURATION_MS = 250; // ms

export const Provider = ({ children }) => {
  const [notif, setNotif] = useStateWithCallback(null);
  const timeoutID = useRef();

  const dismissNotif = useCallback(() => {
    setNotif(null);
    clearTimeout(timeoutID.current);
  }, [setNotif]);

  const notify = useCallback(
    ({
      message,
      type,
      withTimeout = true,
      timeout = DEFAULT_NOTIF_TIMEOUT
    }) => {
      const notificationOptions = { message, type, withTimeout, timeout };
      let shouldDismissNotif = false;

      setNotif(
        (prevNotif) => {
          if (prevNotif && prevNotif.message !== message) {
            shouldDismissNotif = true;
            clearTimeout(timeoutID.current);

            return null;
          } else {
            return notificationOptions;
          }
        },
        () => {
          if (shouldDismissNotif) {
            if (withTimeout)
              setTimeout(
                () => setNotif(notificationOptions),
                NOTIF_ANIMATION_DURATION_MS
              );
            else setNotif(notificationOptions);
          }
        }
      );
    },
    [setNotif]
  );

  const notifyError = useCallback(
    (message, withTimeout = true, timeout = DEFAULT_NOTIF_TIMEOUT) =>
      notify({ message, type: NOTIF_TYPES.ERROR, withTimeout, timeout }),
    [notify]
  );

  const notifySuccess = useCallback(
    (message, withTimeout = true, timeout = DEFAULT_NOTIF_TIMEOUT) =>
      notify({ message, type: NOTIF_TYPES.SUCCESS, withTimeout, timeout }),
    [notify]
  );

  const notifyInfo = useCallback(
    (message, withTimeout = true, timeout = DEFAULT_NOTIF_TIMEOUT) =>
      notify({ message, type: NOTIF_TYPES.INFO, withTimeout, timeout }),
    [notify]
  );

  useEffect(() => {
    if (notif && notif.withTimeout && notif.timeout >= 0) {
      timeoutID.current = setTimeout(dismissNotif, notif.timeout);
    }

    return () => clearTimeout(timeoutID.current);
  }, [dismissNotif, notif]);

  const value = useMemo(
    () => ({
      dismissNotif,
      NOTIF_TYPES,
      notif,
      notifyError,
      notifyInfo,
      notifySuccess
    }),
    [dismissNotif, notif, notifyError, notifySuccess, notifyInfo]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useNotif = () => useContextHook(Context);
