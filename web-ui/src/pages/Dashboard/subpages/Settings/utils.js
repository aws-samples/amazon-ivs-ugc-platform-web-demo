import { ERROR_KEY_MAP, LIMIT_EXCEEDED_EXCEPTION } from '../../../../constants';
import { dashboard as $content } from '../../../../content';

export const getInputErrorData = (error) => {
  let errorName =
    error.name || // Cognito Error
    error.__type || // API Error
    'UnexpectedException'; // Fallback Error

  if (
    error.name === 'NotAuthorizedException' &&
    error.message === 'Password attempts exceeded'
  ) {
    // Manually handling this case because Cognito uses the same error
    // type for "incorrect credentials" and "password attempts exceeded"
    errorName = LIMIT_EXCEEDED_EXCEPTION;
  }

  let { contentKey = '' } = ERROR_KEY_MAP[errorName] || {};
  if (contentKey === 'incorrect_username_or_password') {
    contentKey = 'incorrect_password';
  }

  const message =
    $content.settings_page.input_error[contentKey] || // If we have the copy for this error type, then we will use that
    error.message?.replace(/\.$/, '') || // We try to default to error.message if we don't have the copy for this error type yet
    $content.settings_page.input_error.unexpected_error_occurred; // If error.message does not exist, then we fall back to an unexpected error message

  return { message, contentKey };
};
