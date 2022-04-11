import { promisify } from 'util';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

import { cognitoParams } from './utils';

const userPool = new CognitoUserPool(cognitoParams);

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
  const cognitoUser = new CognitoUser({ Pool: userPool, Username: username });
  cognitoUser.setAuthenticationFlowType('USER_PASSWORD_AUTH');
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
 * Recover the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const recoverPassword = async (userData) => {
  // TEMPORARY
  // eslint-disable-next-line no-unused-vars
  const { email } = userData;
  return false;
};
