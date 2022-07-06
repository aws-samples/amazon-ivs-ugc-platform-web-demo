import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';

export interface ResponseBody {
  [key: string]: string | undefined;
}

export const isCognitoError = (
  error: any
): error is CognitoIdentityProviderServiceException => {
  return error && error.message;
};
