import PropTypes from 'prop-types';
import { useState } from 'react';

import { Error, EyeEnable, EyeDisable } from '../../assets/icons';

import './Input.css';

const Input = ({
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

  let Footer = null;
  if (error) {
    Footer = (
      <div className="error-message">
        <Error />
        <p>{error}</p>
      </div>
    );
  } else if (footer) {
    Footer = <span className="footer">{footer}</span>;
  }

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
      {Footer}
    </div>
  );
};

Input.defaultProps = {
  error: '',
  footer: undefined,
  label: '',
  placeholder: '',
  type: 'text',
  value: ''
};

Input.propTypes = {
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
