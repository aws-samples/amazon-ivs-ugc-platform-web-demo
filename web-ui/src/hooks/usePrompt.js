import { unstable_useBlocker as useBlocker } from 'react-router-dom';
import { useCallback } from 'react';

import useBeforeUnload from './useBeforeUnload';

/**
 * IMPORTANT
 * There are edge cases with this behavior in which React Router cannot
 * reliably access the correct location in the history stack. In such cases the user
 * may attempt to stay on the page but the app navigates anyway, or the app may stay
 * on the correct page but the browser's history stack gets out of whack.
 */
const usePrompt = (when) => {
  const blocker = useBlocker(when);
  const isBlocked = blocker.state === 'blocked';

  const onConfirm = useCallback(() => {
    if (isBlocked) blocker.proceed();
  }, [blocker, isBlocked]);

  const onCancel = useCallback(() => {
    if (isBlocked) blocker.reset();
  }, [blocker, isBlocked]);

  useBeforeUnload(when);

  return { isBlocked, onConfirm, onCancel };
};

export default usePrompt;
