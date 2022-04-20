import { PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const { email: signupEmail = '' } = event.request.userAttributes;

  /**
   * When ENABLE_USER_AUTO_VERIFY is set to "true", all users will be auto-verified.
   * It is not recommend to use it in a production environment.
   */
  if (process.env.ENABLE_USER_AUTO_VERIFY === 'true') {
    event.response.autoConfirmUser = true;

    if (signupEmail) {
      event.response.autoVerifyEmail = true;
    }
  }

  return event;
};
