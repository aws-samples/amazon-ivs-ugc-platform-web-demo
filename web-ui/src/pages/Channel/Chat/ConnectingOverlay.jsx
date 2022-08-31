import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { clsm } from '../../../utils';
import Spinner from '../../../components/Spinner';

const defaultTransition = { duration: 0.25, type: 'tween' };
const defaultAnimationProps = {
  animate: 'visible',
  exit: 'hidden',
  initial: 'hidden',
  transition: defaultTransition
};

const ConnectingOverlay = ({ isLoading }) => {
  const [shouldShowConnectingOverlay, setShouldShowConnectingOverlay] =
    useState(true);

  // Ensures that we show the loader for at least one full animation cycle
  const loaderTimeoutId = useRef();
  useEffect(() => {
    if (isLoading) {
      setShouldShowConnectingOverlay(true);
    } else {
      loaderTimeoutId.current = setTimeout(
        () => setShouldShowConnectingOverlay(false),
        (defaultTransition.duration / 2) * 1000
      );
    }

    return () => clearTimeout(loaderTimeoutId.current);
  }, [isLoading]);

  return (
    <AnimatePresence initial={false}>
      {shouldShowConnectingOverlay && (
        <>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { y: 0 }, hidden: { y: '-150%' } }}
            className={clsm([
              'absolute',
              'top-4',
              'w-11',
              'h-11',
              'p-2.5',
              'rounded-full',
              'bg-lightMode-gray-extraLight',
              'dark:bg-darkMode-gray',
              'z-50'
            ])}
          >
            <Spinner variant="light" />
          </m.div>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
            className={clsm([
              'absolute',
              'top-0',
              'left-0',
              'w-full',
              'h-full',
              'bg-loadingOverlay',
              'z-40'
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
