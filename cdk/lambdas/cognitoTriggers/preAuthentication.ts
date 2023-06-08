import { PreAuthenticationTriggerHandler } from 'aws-lambda';

import { USER_NOT_FOUND_EXCEPTION } from '../../api/shared/constants';

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const { preferred_username } = event.request.userAttributes;
  const { submittedUsername } = event.request.validationData || {};

  if (
    (preferred_username && preferred_username !== submittedUsername) ||
    !submittedUsername // In case the request body is missing validation data
  ) {
    throw new Error(USER_NOT_FOUND_EXCEPTION);
  }

  return event;
};
