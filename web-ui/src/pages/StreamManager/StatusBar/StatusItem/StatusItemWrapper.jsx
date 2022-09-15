import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../utils';

const StatusItemWrapper = ({ isActionable, children, onClick }) => {
  const defaultClasses = clsm([
    'flex',
    'items-center',
    'gap-x-2',
    'py-1',
    'px-2',
    'overflow-hidden'
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
        onClick={onClick}
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
  onClick: PropTypes.func
};

StatusItemWrapper.defaultProps = { onClick: noop };

export default StatusItemWrapper;
