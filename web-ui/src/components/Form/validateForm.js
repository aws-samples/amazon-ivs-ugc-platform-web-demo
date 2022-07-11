import {
  ERROR_KEY_MAP,
  KEY_MAP_REGEX,
  LIMIT_EXCEEDED_EXCEPTION,
  USER_LAMBDA_VALIDATION_EXCEPTION
} from '../../constants';
import { userManagement as $content } from '../../content';

const validatePasswordLength = (password) => {
  const regex = /\S{8,256}/;
  return !!password && regex.test(password);
};

const validatePasswordStrength = (password) => {
  const regex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.[\]{}()?\-"!@#%&/,><':;|_~`])/;
  return !!password && regex.test(password);
};

const validateEmail = (email) => {
  const regex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9])\])/;
  return !!email && regex.test(email);
};

const validateUsername = (username) => {
  const regex = /^[a-z0-9._]+$/i;
  return !!username && regex.test(username);
};

export const validateForm = (formProps, inputNameToValidate) => {
  const { input_error } = $content;

  let formPropsToValidate = formProps;
  if (inputNameToValidate) {
    formPropsToValidate = {
      [inputNameToValidate]: formProps[inputNameToValidate]
    };
  }

  const validationErrors = Object.values(formPropsToValidate).reduce(
    (errors, { value, name, confirms, confirmedBy, skipValidation }) => {
      if (skipValidation || value === '') return errors;
      errors[name] = null;

      const toConfirm = confirms || confirmedBy;
      if (toConfirm && formProps[toConfirm].value) {
        if (formProps[toConfirm].value !== value) {
          errors[confirmedBy || name] = input_error.passwords_mismatch;
        } else {
          errors[toConfirm] = null;
        }

        return errors;
      }

      switch (true) {
        case name.toLowerCase().includes('username'): {
          if (!validateUsername(value))
            errors[name] = input_error.invalid_username;
          break;
        }
        case name.toLowerCase().includes('email'): {
          if (!validateEmail(value)) errors[name] = input_error.invalid_email;
          break;
        }
        case name.toLowerCase().includes('password'): {
          const isValidLength = validatePasswordLength(value);
          const isValidStrength = validatePasswordStrength(value);

          if (!isValidLength && !isValidStrength) {
            errors[name] = input_error.invalid_password;
          } else if (!isValidLength) {
            errors[name] = input_error.invalid_password_length;
          } else if (!isValidStrength) {
            errors[name] = input_error.invalid_password_strength;
          }
          break;
        }
        default:
          break;
      }

      return errors;
    },
    {}
  );

  return Object.keys(validationErrors).length ? validationErrors : null;
};

export const defaultErrorHandler = (error) => {
  let errorName =
    error.name || // Cognito Error
    error.__type || // API Error
    'UnexpectedException'; // Fallback Error
  const { message: errorMessage } = error;

  if (
    error.name === 'NotAuthorizedException' &&
    error.message === 'Password attempts exceeded'
  ) {
    // Manually handling this case because Cognito uses the same error
    // type for "incorrect credentials" and "password attempts exceeded"
    errorName = LIMIT_EXCEEDED_EXCEPTION;
  }

  if (errorName === USER_LAMBDA_VALIDATION_EXCEPTION) {
    const [match] = errorMessage.match(KEY_MAP_REGEX);

    if (match) {
      errorName = match;
    }
  }

  let errorType, inputName, message;

  if (errorName in ERROR_KEY_MAP) {
    const { type, contentKey } = ERROR_KEY_MAP[errorName];
    [errorType, inputName] = type.split('--');
    message =
      errorType === 'notification'
        ? $content.notification.error[contentKey]
        : $content.input_error[contentKey];
  } else {
    errorType = 'notification';
    // Default to error.message if we don't have the copy for this error type yet
    // If error.message does not exists, then we default to an unexpected error message.
    message =
      errorMessage?.replace(/\.$/, '') ||
      $content.notification.error.unexpected_error_occurred;
  }

  return { errorType, inputName, message };
};
