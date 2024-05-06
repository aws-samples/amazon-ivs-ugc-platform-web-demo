import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import {
  createAnimationProps,
  defaultTransition
} from '../../../helpers/animationPropsHelper';
import Spinner from '../../../components/Spinner';
import useCurrentPage from '../../../hooks/useCurrentPage';

const ConnectingOverlay = ({ isLoading = false }) => {
  const currentPage = useCurrentPage();
  const isStreamManagerPage = currentPage === 'stream_manager';
  const [shouldShowConnectingOverlay, setShouldShowConnectingOverlay] =
    useState(true);

  // Ensures that we show the loader for at least one full animation cycle
  const loaderTimeoutId = useRef();
  useEffect(() => {
    if (isLoading) {
      setShouldShowConnectingOverlay(true);
    } else {
      loaderTimeoutId.current = setTimeout(
        () => {
          setShouldShowConnectingOverlay(false);
        },
        (defaultTransition.duration / 2) * 1000
      );
    }

    return () => clearTimeout(loaderTimeoutId.current);
  }, [isLoading]);

  return (
    <AnimatePresence initial={false}>
      {shouldShowConnectingOverlay && (
        <div className={clsm(['absolute', 'w-full', 'h-full'])}>
          <motion.div
            {...createAnimationProps({ animations: ['fadeIn-full'] })}
            className={clsm([
              'absolute',
              'left-0',
              'top-0',
              'w-full',
              'h-full',
              'dark:bg-darkMode-loadingOverlay',
              isStreamManagerPage && 'rounded-3xl'
            ])}
          />
          <motion.div
            {...createAnimationProps({
              animations: ['fadeIn-full', 'slideIn-top']
            })}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

ConnectingOverlay.propTypes = { isLoading: PropTypes.bool };

export default ConnectingOverlay;
