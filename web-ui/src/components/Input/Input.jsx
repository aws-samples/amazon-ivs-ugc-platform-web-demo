import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { ErrorIcon, Visibility, VisibilityOff } from '../../assets/icons';
import Spinner from '../Spinner';
import './Input.css';

const Input = ({
  btnVariant,
  className,
  customStyles,
  description,
  error,
  footer,
  isLoading,
  isRequired,
  label,
  name,
  onChange,
  onClick,
  placeholder,
  readOnly,
  type: initialType,
  value,
  variant
}) => {
  const [inputType, setInputType] = useState(initialType);
  const hideDescription = useRef(false);
  const inputClasses = [inputType];
  if (className) inputClasses.push(className);
  if (initialType === 'button') inputClasses.push(btnVariant);

  const passwordPeek = (event) => {
    event.preventDefault();
    setInputType((prev) => (prev === 'password' ? 'text' : 'password'));
  };

  useEffect(() => {
    hideDescription.current = hideDescription.current || !!error;
  }, [error]);

  return (
    <div className={`outer-input-container ${variant}`}>
      {label && (
        <label className="label h4" htmlFor={name}>
          {label}
        </label>
      )}
      <div
        id={`${name}-input-container`}
        style={customStyles}
        className={`inner-input-container ${
          error !== undefined && error !== null ? 'error' : ''
        }`}
      >
        <input
          {...(onChange ? { onChange } : {})}
          {...(onClick && !isLoading ? { onClick } : {})}
          className={inputClasses.join(' ')}
          id={name}
          initial-type={initialType}
          name={name}
          placeholder={placeholder}
          readOnly={readOnly}
          required={isRequired}
          type={inputType}
          value={isLoading ? '' : value}
        />
        {error && (
          <span className="error-message">
            <ErrorIcon className="error-icon" />
            <p className="p3">{error}</p>
          </span>
        )}
        {initialType === 'password' && value && (
          <button
            className="password-peek"
            onClick={passwordPeek}
            type="button"
          >
            {inputType === 'password' ? (
              <Visibility className="visibility-icon" />
            ) : (
              <VisibilityOff className="visibility-icon" />
            )}
          </button>
        )}
        {isLoading && (
          <div className="spinner-container">
            <Spinner />
          </div>
        )}
      </div>
      {!error && description && !hideDescription.current && (
        <span className="description">
          <p className="p3">{description}</p>
        </span>
      )}
      {footer && <span className="footer">{footer}</span>}
    </div>
  );
};

Input.defaultProps = {
  btnVariant: 'primary',
  className: '',
  customStyles: {},
  description: '',
  error: null,
  footer: undefined,
  isLoading: false,
  isRequired: true,
  label: '',
  onChange: null,
  onClick: null,
  placeholder: '',
  readOnly: false,
  type: 'text',
  value: '',
  variant: 'vertical'
};

Input.propTypes = {
  btnVariant: PropTypes.oneOf([
    'destructive',
    'link',
    'primary',
    'tertiary',
    'secondary'
  ]),
  className: PropTypes.string,
  customStyles: PropTypes.object,
  description: PropTypes.string,
  error: PropTypes.string,
  footer: PropTypes.node,
  isLoading: PropTypes.bool,
  isRequired: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'password', 'button']),
  value: PropTypes.string,
  variant: PropTypes.oneOf(['vertical', 'horizontal'])
};

export default Input;
