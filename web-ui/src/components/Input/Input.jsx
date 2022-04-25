import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { Error, Visibility, VisibilityOff } from '../../assets/icons';
import './Input.css';

const Input = ({
  btnVariant,
  className,
  description,
  error,
  footer,
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
        <label className="label" htmlFor={name}>
          {label}
        </label>
      )}
      <div
        id={`${name}-input-container`}
        className={`inner-input-container ${error ? 'error' : ''}`}
      >
        <input
          {...(onChange ? { onChange } : {})}
          {...(onClick ? { onClick } : {})}
          className={inputClasses.join(' ')}
          id={name}
          initial-type={initialType}
          name={name}
          placeholder={placeholder}
          readOnly={readOnly}
          type={inputType}
          value={value}
        />
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
      </div>
      {error ? (
        <span className="error-message">
          <Error className="error-icon" />
          <p>{error}</p>
        </span>
      ) : (
        description &&
        !hideDescription.current && (
          <span className="description">
            <p>{description}</p>
          </span>
        )
      )}
      {footer && <span className="footer">{footer}</span>}
    </div>
  );
};

Input.defaultProps = {
  btnVariant: 'primary',
  className: '',
  description: '',
  error: '',
  footer: undefined,
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
  description: PropTypes.string,
  error: PropTypes.string,
  footer: PropTypes.node,
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
