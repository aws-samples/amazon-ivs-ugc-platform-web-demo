import { promisify } from 'util';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

import { cognitoParams, apiBaseUrl } from './utils';

const userPool = new CognitoUserPool(cognitoParams);

const getCognitoUser = (username) => {
  const cognitoUser = new CognitoUser({ Pool: userPool, Username: username });
  cognitoUser.setAuthenticationFlowType('USER_PASSWORD_AUTH');
  return cognitoUser;
};

/**
 * Register a new user
 * @param {object} userData registration information about the new user
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 */
export const register = async (userData) => {
  const { username, email, password } = userData;
  const emailAttr = new CognitoUserAttribute({ Name: 'email', Value: email });
  const userAttributes = [emailAttr];
  let result, error;

  userPool.signUp[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      userPool.signUp(username, password, userAttributes, null, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const signUp = promisify(userPool.signUp);
    result = await signUp();

    if (result) alert('User Registration SUCCESSFUL!');
  } catch (err) {
    error = err;
    console.error(err);
    alert(`User Registration FAILED! \n${err.message}`);
  }

  return { result, error };
};

/**
 * Sign in an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.username
 * @param {string} userData.password
 */
export const signIn = async (userData) => {
  const { username, password } = userData;
  const cognitoUser = getCognitoUser(username);
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password
  });
  let result, error;

  cognitoUser.authenticateUser[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: resolve,
        onFailure: reject
      });
    });

  try {
    const authenticate = promisify(cognitoUser.authenticateUser);
    result = await authenticate();

    if (result) alert('User Authentication SUCCESSFUL!');
  } catch (err) {
    error = err;
    console.error(err);
    alert(`User Authentication FAILED! \n${err.message}`);
  }

  return { result, error };
};

/**
 * Reset the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const sendResetPasswordRequest = async (userData) => {
  const { email } = userData;
  let result, error;

  try {
    const url = `${apiBaseUrl}user/reset`;
    result = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  } catch (err) {
    error = err;
    console.error(err);
    alert(`Password Recovery Request FAILED! \n${err.message}`);
  }

  return { result, error };
};

export const resetPassword = async (
  username,
  verificationCode,
  newPassword
) => {
  const cognitoUser = getCognitoUser(username);
  let result, error;

  cognitoUser.confirmPassword[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess: resolve,
        onFailure: reject
      });
    });

  try {
    const confirmPassword = promisify(cognitoUser.confirmPassword);
    result = await confirmPassword();

    if (result) alert('Password Confirmation SUCCESSFUL!');
  } catch (err) {
    error = err;
    console.error(err);
    alert(`Password Confirmation FAILED! \n${err.message}`);
  }

  return { result, error };
};
