import { userManagement as $content } from '../../content';

const SUBMISSION_ERROR_KEY_MAP = {
  UsernameExistsException: {
    type: 'input_error--username',
    contentKey: 'unavailable_username'
  },
  EmailExistsException: {
    type: 'input_error--email',
    contentKey: 'unavailable_email'
  },
  // --- TEMPORARY --- //
  UserLambdaValidationException: {
    type: 'input_error--email',
    contentKey: 'unavailable_email'
  },
  // ----------------- //
  UserNotFoundException: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  NotAuthorizedException: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  UnexpectedException: {
    type: 'notification',
    contentKey: 'unexpected_error_occurred'
  },
  LimitExceededException: {
    type: 'notification',
    contentKey: 'attempt_limit_exceeded'
  }
};

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
  const regex = /^\S+$/;
  return !!username && regex.test(username);
};

export const validateForm = (formProps) => {
  const { input_error } = $content;

  const validationErrors = Object.values(formProps).reduce(
    (errors, { value, name, confirms }) => {
      if (confirms) {
        if (!value || formProps[confirms].value !== value) {
          errors[name] = input_error.passwords_mismatch;
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

export const formatError = (error) => {
  let errorName =
    error.name || // Cognito Error
    error.__type || // API Error
    'UnexpectedException'; // Fallback Error

  if (
    error.name === 'NotAuthorizedException' &&
    error.message === 'Password attempts exceeded'
  ) {
    // Manually handling this case because Cognito uses the same error
    // type for "incorrect creds" and "password attempts exceeded"
    errorName = 'LimitExceededException';
  }

  const { type, contentKey } = SUBMISSION_ERROR_KEY_MAP[errorName] || {};
  const [errorType, inputType] = type?.split('--') || ['notification'];
  let message = error.message.replace(/\.$/, ''); // Default to error.message if we don't have the copy for this error type yet

  if (errorType === 'notification') {
    message = $content[errorType].error[contentKey] || message;
  } else if (errorType === 'input_error') {
    message = $content[errorType][contentKey] || message;
  }

  return { errorType, inputType, message };
};
