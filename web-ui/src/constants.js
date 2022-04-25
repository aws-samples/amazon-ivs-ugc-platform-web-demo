export const USERNAME_EXISTS_EXCEPTION = 'UsernameExistsException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';
export const NOT_AUTHORIZED_EXCEPTION = 'NotAuthorizedException';
export const LIMIT_EXCEEDED_EXCEPTION = 'LimitExceededException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';

export const ACCOUNT_REGISTRATION_EXCEPTION = 'AccountRegistrationException';
export const FORGOT_PASSWORD_EXCEPTION = 'ForgotPasswordException';
export const ACCOUNT_DELETION_EXCEPTION = 'AccountDeletionException';
export const RESET_STREAM_KEY_EXCEPTION = 'ResetStreamKeyException';
export const CHANGE_USERNAME_EXCEPTION = 'ChangeUsernameException';

export const ERROR_KEY_MAP = {
  [USERNAME_EXISTS_EXCEPTION]: {
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

export const GENERIC_ERROR_MESSAGE = 'Unexpected Error Occurred';
