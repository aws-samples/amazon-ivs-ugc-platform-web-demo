import PropTypes from 'prop-types';
import { clsm } from '../../../utils';
import { ErrorIcon } from '../../../assets/icons';

const ComposerErrorMessage = ({ errorMessage }) => {
  if (!errorMessage) return;
  return (
    <div
      className={clsm([
        'bg-darkMode-red',
        'flex',
        'font-bold',
        'leading-[18.15px]',
        'px-5',
        'pt-3',
        'pb-[11px]',
        'rounded-t-3xl',
        'text-black',
        'text-left',
        'width-full'
      ])}
    >
      <span className={clsm(['mr-3'])}>
        <ErrorIcon />
      </span>
      <p>{errorMessage}</p>
    </div>
  );
};

ComposerErrorMessage.propTypes = {
  errorMessage: PropTypes.string.isRequired
};

export default ComposerErrorMessage;
