import { m, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import Spinner from '../../../components/Spinner';
import useCurrentPage from '../../../hooks/useCurrentPage';
import usePrevious from '../../../hooks/usePrevious';

const defaultTransition = { duration: 0.25, type: 'tween' };
const defaultAnimationProps = {
  animate: 'visible',
  exit: 'hidden',
  initial: 'hidden',
  transition: defaultTransition
};

const ConnectingOverlay = ({ isLoading }) => {
  const currentPage = useCurrentPage();
  const isStreamManagerPage = currentPage === 'stream_manager';
  const previousIsLoading = usePrevious(isLoading);
  const [shouldShowConnectingOverlay, setShouldShowConnectingOverlay] =
    useState(true);

  // Ensures that we show the loader for at least one full animation cycle
  const loaderTimeoutId = useRef();
  useEffect(() => {
    if (isLoading) {
      setShouldShowConnectingOverlay(true);
    } else if (!isLoading && previousIsLoading) {
      loaderTimeoutId.current = setTimeout(
        () => setShouldShowConnectingOverlay(false),
        (defaultTransition.duration / 2) * 1000
      );
    }

    return () => clearTimeout(loaderTimeoutId.current);
  }, [isLoading, previousIsLoading]);

  return (
    <AnimatePresence initial={false}>
      {shouldShowConnectingOverlay && (
        <div className={clsm(['absolute', 'w-full', 'h-full'])}>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
            className={clsm([
              'absolute',
              'left-0',
              'top-0',
              'w-full',
              'h-full',
              'bg-darkMode-loadingOverlay',
              'dark:bg-darkMode-loadingOverlay',
              isStreamManagerPage
                ? 'rounded-3xl'
                : 'bg-lightMode-loadingOverlay'
            ])}
          ></m.div>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { y: 0 }, hidden: { y: '-150%' } }}
            className={clsm([
              'absolute',
              'top-4',
              'left-0',
              'right-0',
              'rounded-full',
              'w-11',
              'h-11',
              'm-auto',
              'p-2.5',
              'bg-lightMode-gray',
              'dark:bg-darkMode-gray',
              isStreamManagerPage && 'bg-lightMode-gray-extraLight'
            ])}
          >
            <Spinner variant="light" />
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};

ConnectingOverlay.defaultProps = { isLoading: false };

ConnectingOverlay.propTypes = { isLoading: PropTypes.bool };

export default ConnectingOverlay;
