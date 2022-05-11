export const USE_MOCKS = false;

export const USERNAME_EXISTS_EXCEPTION = 'UsernameExistsException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';
export const NOT_AUTHORIZED_EXCEPTION = 'NotAuthorizedException';
export const LIMIT_EXCEEDED_EXCEPTION = 'LimitExceededException';
export const ALIAS_EXISTS_EXCEPTION = 'AliasExistsException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';
export const USER_LAMBDA_VALIDATION_EXCEPTION = 'UserLambdaValidationException';

export const ERROR_KEY_MAP = {
  [USERNAME_EXISTS_EXCEPTION]: {
    type: 'input_error--username',
    contentKey: 'unavailable_username'
  },
  [ALIAS_EXISTS_EXCEPTION]: {
    type: 'input_error--username',
    contentKey: 'unavailable_username'
  },
  [EMAIL_EXISTS_EXCEPTION]: {
    type: 'input_error--email',
    contentKey: 'unavailable_email'
  },
  [USER_NOT_FOUND_EXCEPTION]: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  [NOT_AUTHORIZED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  [LIMIT_EXCEEDED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'attempt_limit_exceeded'
  },
  [UNEXPECTED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'unexpected_error_occurred'
  }
};

export const KEY_MAP_REGEX = new RegExp(
  `${Object.keys(ERROR_KEY_MAP).join('|')}`
);

export const GENERIC_ERROR_MESSAGE = 'Unexpected Error Occurred';
