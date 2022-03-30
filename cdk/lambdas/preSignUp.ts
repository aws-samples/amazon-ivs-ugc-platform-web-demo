import { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * This lambda function auto-verifies all users.
 * It is not recommend to use it in a production environment.
 */
export const handler: PreSignUpTriggerHandler = (event, _context, callback) => {
  event.response.autoConfirmUser = true;

  if (event.request.userAttributes.hasOwnProperty('email')) {
    event.response.autoVerifyEmail = true;
  }

  callback(null, event);
};
