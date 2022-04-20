import { CustomMessageTriggerHandler } from 'aws-lambda';

export const handler: CustomMessageTriggerHandler = (
  event,
  _context,
  callback
) => {
  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailMessage = `Use the link below to set up a new password for your Stream Health Dashboard account. This password reset link is only valid for the next 1 hour. If you did not make this request, you can safely disregard this email.\n<a href=${process.env.USER_MANAGEMENT_CLIENT_BASE_URL}/reset?code=${event.request.codeParameter}&username=${event.userName}>Reset Password</a>`;
  } else if (event.triggerSource === 'CustomMessage_SignUp') {
    event.response.emailMessage = `Use the link below to confirm your email for your Stream Health Dashboard account.<a href=${process.env.USER_MANAGEMENT_CLIENT_BASE_URL}/login?code=${event.request.codeParameter}&username=${event.userName}>Confirm Email</a>`;
  }

  callback(null, event);
};
