import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { Error, EyeEnable, EyeDisable } from '../../assets/icons';
import './Input.css';

const Input = ({
  description,
  error,
  footer,
  label,
  name,
  onChange,
  placeholder,
  type: initialType,
  value
}) => {
  const [inputType, setInputType] = useState(initialType);
  const hideDescription = useRef(false);

  useEffect(() => {
    hideDescription.current = hideDescription.current || !!error;
  }, [error]);

  return (
    <div className="outer-input-container">
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
          id={name}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={inputType}
          initial-type={initialType}
          value={value}
        />
        {initialType === 'password' && value && (
          <button
            type="button"
            className="password-peek"
            onClick={(event) => {
              event.preventDefault();
              setInputType((prev) =>
                prev === 'password' ? 'text' : 'password'
              );
            }}
          >
            {inputType === 'password' ? <EyeEnable /> : <EyeDisable />}
          </button>
        )}
      </div>
      {error ? (
        <span className="error-message">
          <Error />
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
  description: '',
  error: '',
  footer: undefined,
  label: '',
  placeholder: '',
  type: 'text',
  value: ''
};

Input.propTypes = {
  description: PropTypes.string,
  error: PropTypes.string,
  footer: PropTypes.node,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.oneOf(['text', 'password']),
  value: PropTypes.string
};

export default Input;
