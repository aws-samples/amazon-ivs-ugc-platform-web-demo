import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { ErrorIcon } from '../../../assets/icons';

const ComposerErrorMessage = ({ errorMessage }) => {
  if (!errorMessage) return;

  return (
    <div
      className={clsm([
        'bg-lightMode-red',
        'dark:bg-darkMode-red',
        'dark:text-black',
        'flex',
        'font-bold',
        'leading-[18.15px]',
        'pb-[11px]',
        'pt-3',
        'px-5',
        'rounded-t-3xl',
        'text-left',
        'text-white',
        'width-full'
      ])}
    >
      <ErrorIcon
        className={clsm(['dark:fill-black', 'fill-white', 'mr-3', 'shrink-0'])}
      />
      <p>{errorMessage}</p>
    </div>
  );
};

ComposerErrorMessage.propTypes = {
  errorMessage: PropTypes.string.isRequired
};

export default ComposerErrorMessage;
