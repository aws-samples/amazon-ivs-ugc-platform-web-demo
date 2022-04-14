import { CustomMessageTriggerHandler } from 'aws-lambda';

export const handler: CustomMessageTriggerHandler = (
  event,
  _context,
  callback
) => {
  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailMessage = `Use the link below to set up a new password for your Stream Health Dashboard account. This password reset link is only valid for the next 1 hour. If you did not make this request, you can safely disregard this email.\n<a href=${process.env.PASSWORD_RESET_CLIENT_BASE_URL}/reset?code=${event.request.codeParameter}&username=${event.userName}>Reset Password</a>`;
  }

  callback(null, event);
};
