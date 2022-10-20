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
        <>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { y: 0 }, hidden: { y: '-150%' } }}
            className={clsm([
              'absolute',
              'bg-lightMode-gray',
              'dark:bg-darkMode-gray',
              'h-11',
              'p-2.5',
              'rounded-full',
              'top-4',
              'w-11',
              'z-50',
              isStreamManagerPage && 'bg-lightMode-gray-extraLight'
            ])}
          >
            <Spinner variant="light" />
          </m.div>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
            className={clsm([
              'absolute',
              'bg-darkMode-loadingOverlay',
              'dark:bg-darkMode-loadingOverlay',
              'h-full',
              'left-0',
              'top-0',
              'w-full',
              'z-40',
              !isStreamManagerPage && 'bg-lightMode-loadingOverlay'
            ])}
          ></m.div>
        </>
      )}
    </AnimatePresence>
  );
};

ConnectingOverlay.defaultProps = { isLoading: false };

ConnectingOverlay.propTypes = { isLoading: PropTypes.bool };

export default ConnectingOverlay;
