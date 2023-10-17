import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';

import { DEFAULT_NOTIF_TIMEOUT } from '../constants';
import { defaultTransition } from '../helpers/animationPropsHelper';
import useContextHook from './useContextHook';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Notification';

export const NOTIF_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  NEUTRAL: 'neutral'
};

const defaultNotifOptions = {
  asPortal: false,
  timeout: DEFAULT_NOTIF_TIMEOUT,
  withTimeout: true
};

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
        asPortal = defaultNotifOptions.asPortal,
        timeout = defaultNotifOptions.timeout,
        withTimeout = defaultNotifOptions.withTimeout
      } = defaultNotifOptions
    ) => {
      const notifProps = { asPortal, message, timeout, type, withTimeout };
      let shouldDismissNotif = false;

      setNotif(
        (prevNotif) => {
          if (prevNotif) {
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
              setTimeout(() => setNotif(notifProps), defaultTransition * 1000);
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

  const notifyNeutral = useCallback(
    (message, options) => notify(message, NOTIF_TYPES.NEUTRAL, options),
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
      notif,
      notifyError,
      notifyInfo,
      notifySuccess,
      notifyNeutral
    }),
    [dismissNotif, notif, notifyError, notifyInfo, notifySuccess, notifyNeutral]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useNotif = () => useContextHook(Context);
