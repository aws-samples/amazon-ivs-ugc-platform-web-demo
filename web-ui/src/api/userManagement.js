import { promisify } from 'util';
import { AuthenticationDetails } from 'amazon-cognito-identity-js';

import { getCognitoUser, userPool, apiBaseUrl, SessionError } from './utils';

const authFetch = async ({
  url,
  method = 'GET',
  body = {},
  includeUserData = false
}) => {
  let result, error;

  try {
    const { result: session, error: sessionError } = await getCurrentSession();
    if (sessionError) throw sessionError;

    const accessToken = session.getAccessToken().getJwtToken();
    const tokenPayload = session.getIdToken().decodePayload();
    const payload =
      method !== 'GET'
        ? { ...body, ...(includeUserData ? tokenPayload : {}) }
        : undefined;

    const response = await fetch(url, {
      body: JSON.stringify(payload),
      headers: { Authorization: accessToken },
      method
    });
    const data = await response.json();

    if (response.ok) {
      result = data;
    } else {
      // API Errors
      error = data;
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

const unauthFetch = async ({ url, method = 'GET', body }) => {
  let result, error;

  try {
    const response = await fetch(url, {
      body: JSON.stringify(body),
      method
    });

    const data = await response.json();

    if (response.ok) {
      result = data;
    } else {
      // API Errors
      error = data;
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

/**
 * Gets the session details of the currently authenticated user, if one exists.
 */
export const getCurrentSession = async () => {
  let result, error;

  try {
    const currentCognitoUser = userPool.getCurrentUser(); // Using the authenticated Cognito user from local storage

    if (!currentCognitoUser)
      throw new SessionError('No Authenticated User Exists');

    currentCognitoUser.getSession[promisify.custom] = () =>
      new Promise((resolve, reject) => {
        currentCognitoUser.getSession((err, session) => {
          if (session) resolve(session);
          reject(err);
        });
      });

    const getSession = promisify(currentCognitoUser.getSession);
    const session = await getSession();

    if (!session.isValid()) throw new SessionError('Invalid Session');

    result = session;
  } catch (err) {
    error = err;

    if (!(err instanceof SessionError)) {
      console.error(err);
    }
  }

  return { result, error };
};

/**
 * Register a new user
 * @param {object} userData registration information about the new user
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 */
export const register = async (userData) => {
  return await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/user/register`
  });
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
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

/**
 * Reset the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const sendResetPasswordRequest = async (userData) => {
  return await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/user/reset`
  });
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
  }

  return { result, error };
};

export const verifyUserEmail = async (username, verificationCode) => {
  const cognitoUser = getCognitoUser(username);
  let result, error;

  cognitoUser.confirmRegistration[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(verificationCode, false, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const confirmRegistration = promisify(cognitoUser.confirmRegistration);
    result = await confirmRegistration();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const resendVerificationRequest = async (username) => {
  const cognitoUser = getCognitoUser(username);
  let result, error;

  cognitoUser.resendConfirmationCode[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const resendConfirmationCode = promisify(
      cognitoUser.resendConfirmationCode
    );
    result = await resendConfirmationCode();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const createResources = async () => {
  return await authFetch({
    url: `${apiBaseUrl}/user/resources/create`,
    method: 'POST',
    includeUserData: true
  });
};

export const getUserData = async () => {
  return await authFetch({ url: `${apiBaseUrl}/user` });
};
