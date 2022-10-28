import PropTypes from 'prop-types';

import { app as $content } from '../../content';
import { clsm, noop } from '../../utils';
import { Visibility, VisibilityOff } from '../../assets/icons';

const PasswordPeekButton = ({ label, inputType, setInputType, isVisible }) => {
  if (!isVisible) return;

  const isPasswordHidden = inputType === 'password';
  const buttonClasses = clsm([
    'absolute',
    'bg-none',
    'cursor-pointer',
    'dark:focus:shadow-white',
    'flex',
    'focus:outline-none',
    'focus:p-1',
    'focus:right-4',
    'focus:rounded-3xl',
    'focus:shadow-focus',
    'focus:shadow-lightMode-gray-dark',
    'focus:top-2',
    'items-center',
    'justify-center',
    'px-0',
    'py-[13px]',
    'right-5',
    'top-0'
  ]);
  const visibilityIconClasses = clsm([
    'dark:fill-white',
    'fill-lightMode-gray-dark',
    'h-[18px]',
    'w-[18px]'
  ]);

  const passwordPeek = (event) => {
    event.preventDefault();
    setInputType((prev) => (prev === 'password' ? 'text' : 'password'));
  };
  return (
    <button
      aria-label={`${
        isPasswordHidden ? $content.show : $content.hide
      } ${label.toLowerCase()}`}
      className={buttonClasses}
      onClick={passwordPeek}
      type="button"
    >
      {isPasswordHidden ? (
        <Visibility className={visibilityIconClasses} />
      ) : (
        <VisibilityOff className={visibilityIconClasses} />
      )}
    </button>
  );
};

PasswordPeekButton.defaultProps = {
  label: '',
  inputType: 'password',
  setInputType: noop,
  isVisible: false
};

PasswordPeekButton.propTypes = {
  label: PropTypes.string,
  inputType: PropTypes.oneOf(['text', 'password', 'button', 'number']),
  setInputType: PropTypes.func,
  isVisible: PropTypes.bool
};

export default PasswordPeekButton;
