import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ErrorIcon } from '../../assets/icons';

const ErrorMessage = ({ error }) => {
  if (!error) return;

  return (
    <span
      className={clsx([
        '[&>svg]:mt-[-1px]',
        'flex',
        'gap-x-[6.33px]',
        'pt-[5px]',
        'text-[13px]',
        'text-darkMode-red'
      ])}
    >
      <ErrorIcon
        className={clsx(['fill-darkMode-red', 'h-4', 'min-w-[4px]', 'w-4'])}
      />
      <p className="p3">{error}</p>
    </span>
  );
};

ErrorMessage.defaultProps = {
  error: null
};

ErrorMessage.propTypes = {
  error: PropTypes.string
};

export default ErrorMessage;
