import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import ErrorMessage from './InputErrorMessage';
import PasswordPeekButton from './PasswordPeekButton';
import Description from './InputDescription';
import Label from './InputLabel';
import { clsm } from '../../utils';
import {
  OUTER_INPUT_VARIANT_CLASSES as outerInputVariantClasses,
  INNER_INPUT_VARIANT_CLASSES as innerInputVariantClasses,
  INPUT_TYPE_CLASSES as inputTypeClasses,
  INPUT_ERROR_CLASSES as inputErrorClasses
} from './InputTheme';

const Input = ({
  className,
  customStyles,
  description,
  error,
  footer,
  isRequired,
  label,
  name,
  onBlur,
  onChange,
  onClick,
  onFocus,
  placeholder,
  readOnly,
  type: initialType,
  value,
  variant,
  autoCorrect,
  autoCapitalize
}) => {
  const [inputType, setInputType] = useState(initialType);
  const hideDescription = useRef(false);
  const outerInputClasses = clsm(variant, outerInputVariantClasses[variant]);

  const innerInputClasses = clsm(innerInputVariantClasses);

  const inputClasses = clsm(
    inputTypeClasses[initialType],
    error !== undefined && error !== null && inputErrorClasses,
    className
  );

  useEffect(() => {
    hideDescription.current = hideDescription.current || !!error;
  }, [error]);

  return (
    <div className={outerInputClasses}>
      <Label label={label} htmlFor={name} variant={variant} />
      <div
        id={`${name}-input-container`}
        style={customStyles}
        className={innerInputClasses}
      >
        <input
          {...(onChange ? { onChange } : {})}
          {...(onClick ? { onClick } : {})}
          {...(onFocus ? { onFocus } : {})}
          {...(onBlur ? { onBlur } : {})}
          className={inputClasses}
          id={name}
          initial-type={initialType}
          name={name}
          placeholder={placeholder}
          readOnly={readOnly}
          required={isRequired}
          style={
            initialType === 'password' && value ? { paddingRight: '52px' } : {}
          }
          type={inputType}
          value={value}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
        />
        <ErrorMessage error={error} />
        <PasswordPeekButton
          isVisible={initialType === 'password' && !!value}
          label={label}
          inputType={inputType}
          setInputType={setInputType}
        />
      </div>
      <Description
        isVisible={!error && !!description && !hideDescription.current}
        description={description}
      />
      {footer && <span className="mt-[15px]">{footer}</span>}
    </div>
  );
};

Input.defaultProps = {
  autoCorrect: 'off',
  autoCapitalize: 'none',
  className: '',
  customStyles: {},
  description: '',
  error: null,
  footer: undefined,
  isRequired: true,
  label: '',
  onBlur: null,
  onChange: null,
  onClick: null,
  onFocus: null,
  placeholder: '',
  readOnly: false,
  type: 'text',
  value: '',
  variant: 'vertical'
};

Input.propTypes = {
  autoCorrect: PropTypes.string,
  autoCapitalize: PropTypes.string,
  className: PropTypes.string,
  customStyles: PropTypes.object,
  description: PropTypes.string,
  error: PropTypes.string,
  footer: PropTypes.node,
  isRequired: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'password']),
  value: PropTypes.string,
  variant: PropTypes.oneOf(['vertical', 'horizontal'])
};

export default Input;
