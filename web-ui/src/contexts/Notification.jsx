import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';

import { DEFAULT_NOTIF_TIMEOUT } from '../constants';
import useContextHook from './useContextHook';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Notification';

const NOTIF_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};

const defaultNotifOptions = {
  className: '',
  timeout: DEFAULT_NOTIF_TIMEOUT,
  withTimeout: true
};

export const NOTIF_ANIMATION_DURATION_MS = 250; // ms

export const Provider = ({ children }) => {
  const [notif, setNotif] = useStateWithCallback(null);
  const timeoutID = useRef();

  const dismissNotif = useCallback(() => {
    setNotif(null);
    clearTimeout(timeoutID.current);
  }, [setNotif]);

  const notify = useCallback(
    (
      message,
      type,
      {
        withTimeout = defaultNotifOptions.withTimeout,
        timeout = defaultNotifOptions.timeout,
        className = defaultNotifOptions.className
      } = defaultNotifOptions
    ) => {
      const notifProps = { message, type, withTimeout, timeout, className };
      let shouldDismissNotif = false;

      setNotif(
        (prevNotif) => {
          if (prevNotif && prevNotif.message !== message) {
            shouldDismissNotif = true;
            clearTimeout(timeoutID.current);

            return null;
          } else {
            return notifProps;
          }
        },
        () => {
          if (shouldDismissNotif) {
            if (withTimeout)
              setTimeout(
                () => setNotif(notifProps),
                NOTIF_ANIMATION_DURATION_MS
              );
            else setNotif(notifProps);
          }
        }
      );
    },
    [setNotif]
  );

  const notifyError = useCallback(
    (message, options) => notify(message, NOTIF_TYPES.ERROR, options),
    [notify]
  );

  const notifySuccess = useCallback(
    (message, options) => notify(message, NOTIF_TYPES.SUCCESS, options),
    [notify]
  );

  const notifyInfo = useCallback(
    (message, options) => notify(message, NOTIF_TYPES.INFO, options),
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
