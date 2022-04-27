import { PreAuthenticationTriggerHandler } from 'aws-lambda';

import { INCORRECT_USERNAME_EXCEPTION } from '../../api/utils/constants';

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const { preferred_username } = event.request.userAttributes;
  const { submittedUsername } = event.request.validationData || {};

  if (
    (preferred_username && preferred_username !== submittedUsername) ||
    !submittedUsername // In case the request body is missing validation data
  ) {
    throw new Error(INCORRECT_USERNAME_EXCEPTION);
  }

  return event;
};
