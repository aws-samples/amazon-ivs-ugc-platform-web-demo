import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import useCurrentPage from '../../../hooks/useCurrentPage';

const StatusItemWrapper = ({ isActionable, children, itemButtonProps }) => {
  const currentPage = useCurrentPage();
  const isStreamHealthPage = currentPage === 'stream_health';

  const defaultClasses = clsm([
    'flex',
    'items-center',
    'space-x-2',
    'py-1',
    'px-2',
    'overflow-hidden',
    isStreamHealthPage && 'min-w-[80px]'
  ]);

  if (isActionable)
    // Actionable status item
    return (
      <button
        className={clsm([
          defaultClasses,
          'rounded-3xl',
          'transition-all',
          'duration-[0.15s]',
          'ease-in-out',
          'shadow-black',
          'dark:shadow-white',
          'focus:outline-none',
          'focus:shadow-focusOuter',
          'hover:bg-lightMode-gray-extraLight-hover',
          'dark:hover:bg-darkMode-gray-dark-hover'
        ])}
        type="button"
        {...itemButtonProps}
      >
        {children}
      </button>
    );

  // Static status item
  return <div className={defaultClasses}>{children}</div>;
};

StatusItemWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  isActionable: PropTypes.bool.isRequired,
  itemButtonProps: PropTypes.shape({ onClick: PropTypes.func })
};

StatusItemWrapper.defaultProps = { itemButtonProps: null };

export default StatusItemWrapper;
