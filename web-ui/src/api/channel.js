import { promisify } from 'util';
import { AuthenticationDetails } from 'amazon-cognito-identity-js';

import {
  apiBaseUrl,
  authFetch,
  generatePresignedPost,
  getCognitoUser,
  getCurrentSession,
  unauthFetch,
  userPool
} from './utils';

/**
 * Register a new user
 * @param {object} userData registration information about the new user
 * @param {string} userData.avatar
 * @param {string} userData.color
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.username
 */
export const register = async (userData) =>
  await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/channel/register`
  });

/**
 * Sign in an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.username
 * @param {string} userData.password
 */
export const signIn = async (userData) => {
  const { username, password } = userData;
  const trimmedUsername = (username || '').trim();

  let result, error;

  try {
    const cognitoUser = await getCognitoUser(trimmedUsername);
    const authenticationDetails = new AuthenticationDetails({
      ClientMetadata: { submittedUsername: trimmedUsername },
      Username: trimmedUsername,
      Password: password
    });

    cognitoUser.authenticateUser[promisify.custom] = () =>
      new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: resolve,
          onFailure: reject
        });
      });
    const authenticate = promisify(cognitoUser.authenticateUser);
    result = await authenticate();
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  cognitoUser.signOut();
  return true;
};

/**
 * Reset the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const sendResetPasswordRequest = async (userData) =>
  await unauthFetch({
    body: userData,
    method: 'POST',
    url: `${apiBaseUrl}/channel/password/reset`
  });

export const resetPassword = async (
  username,
  verificationCode,
  newPassword
) => {
  const cognitoUser = await getCognitoUser(username);
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
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const cognitoUser = await getCognitoUser();
  let result, error;

  cognitoUser.changePassword[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.changePassword(currentPassword, newPassword, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    // 1. Update password
    const changeUserPassword = promisify(cognitoUser.changePassword);
    result = await changeUserPassword();

    // 2. Sign out of all sessions
    cognitoUser.globalSignOut[promisify.custom] = () =>
      new Promise((resolve, reject) => {
        cognitoUser.globalSignOut({
          onSuccess: resolve,
          onFailure: reject
        });
      });
    const globalUserSignOut = promisify(cognitoUser.globalSignOut);
    await globalUserSignOut();

    // 3. Sign back in the current session
    await signIn({ username: cognitoUser.username, password: newPassword });
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const verifyUserEmail = async (username, verificationCode) => {
  const cognitoUser = await getCognitoUser(username);
  let isEmailVerified = false;
  let result, error;

  cognitoUser.getUserData[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.getUserData((err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  cognitoUser.confirmRegistration[promisify.custom] = () =>
    new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(verificationCode, false, (err, val) => {
        if (val) resolve(val);
        reject(err);
      });
    });

  try {
    const getUserData = promisify(cognitoUser.getUserData);
    const confirmRegistration = promisify(cognitoUser.confirmRegistration);

    try {
      const userData = await getUserData();
      const { Value } =
        userData.UserAttributes.find(
          ({ Name: attrName }) => attrName === 'email_verified'
        ) || {};

      isEmailVerified = Value === 'true';
    } catch (error) {
      /* swallow the error - user data is unavailable, so their email was likely not verified  */
    }

    if (!isEmailVerified) {
      result = await confirmRegistration();
    }
  } catch (err) {
    error = err;
    console.error(err);
  }

  return { result, error };
};

export const resendVerificationRequest = async (username) => {
  const cognitoUser = await getCognitoUser(username);
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

export const createResources = async () =>
  await authFetch({
    url: `${apiBaseUrl}/channel/resources/create`,
    method: 'POST',
    includeUserData: true
  });

export const getUserData = async () =>
  await authFetch({ url: `${apiBaseUrl}/channel` });

export const getUserFollowingListData = () =>
  authFetch({ url: `${apiBaseUrl}/channel/followingList` });

export const changeUsername = async ({ username: newUsername }) =>
  await authFetch({
    body: { newUsername },
    method: 'PUT',
    url: `${apiBaseUrl}/channel/username/update`
  });

/**
 * Changes a user's preferences
 * @param {object} userPreferences user preferences to change
 * @param {string} [userPreferences.avatar]
 * @param {string} [userPreferences.color]
 */
export const changeUserPreferences = async (userPreferences) =>
  await authFetch({
    body: userPreferences,
    method: 'PUT',
    url: `${apiBaseUrl}/channel/preferences/update`
  });

export const resetStreamKey = async () =>
  await authFetch({ url: `${apiBaseUrl}/channel/streamKey/reset` });

export const deleteAccount = async () =>
  await authFetch({ url: `${apiBaseUrl}/channel`, method: 'DELETE' });

/**
 * @typedef {Object} ChatTokenData
 * @property {string} token
 * @property {string} tokenExpirationTime
 * @property {string} sessionExpirationTime
 *
 * @typedef {Object} ChatTokenResponse
 * @property {ChatTokenData} result
 * @property {Error} error
 */

/**
 * Requests an IVS chat token used to establish a connection with the Amazon IVS Chat Messaging API.
 *
 * If the user requesting the token is authenticated, then a private token will be requested
 * containing VIEW_MESSAGE (implicit) and SEND_MESSAGE capabilities (and additionally DELETE_MESSAGE
 * and DISCONNECT_USER capabilities if the user is a moderator); otherwise, a public token will be
 * requested containing only the VIEW capability.
 *
 * @param {string} chatRoomOwnerUsername username of the owner for the chat room to which access is being requested
 * @returns {ChatTokenResponse}
 */
export const getChatToken = async (
  chatRoomOwnerUsername,
  abortControllerSignal
) => {
  const { result: session } = await getCurrentSession();
  const isSessionValid = !!session;
  const _fetch = isSessionValid ? authFetch : unauthFetch;

  return await _fetch({
    method: 'POST',
    url: `${apiBaseUrl}/channel/chatToken/create`,
    body: { chatRoomOwnerUsername },
    signal: abortControllerSignal
  });
};

export const banUser = async (bannedChannelArn) =>
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/channel/ban`,
    body: { bannedChannelArn }
  });

export const unbanUser = async (bannedChannelArn) =>
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/channel/unban`,
    body: { bannedChannelArn }
  });

export const sendStreamAction = async (metadataString) =>
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/channel/actions/send`,
    body: { metadata: metadataString }
  });

export const uploadFileToS3 = async ({ assetType, file }) => {
  let result, error;

  try {
    const contentType = file.type;
    const { result: presignedPost, error: presignedPostError } =
      await generatePresignedPost({ assetType, contentType });

    if (presignedPostError) throw presignedPostError;

    const formData = new FormData();
    Object.entries(presignedPost.fields).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append('Content-Type', contentType);
    formData.append('file', file); // The file has to be the last element

    const response = await fetch(presignedPost.url, {
      body: formData,
      method: 'POST'
    });

    if (response.ok) {
      const versionId = response.headers.get('x-amz-version-id');
      const uploadDateTime = response.headers.get('Date');
      const previewUrl = new URL(response.headers.get('Location'));
      previewUrl.searchParams.append('versionId', versionId); // handles the case where the browser caches the image URL with a previous upload

      result = { previewUrl: previewUrl.toString(), uploadDateTime };
    } else {
      // POST Errors
      throw new Error('A Presigned Post fetch error occurred');
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

export const deleteChannelAsset = async (assetType) =>
  await authFetch({
    method: 'DELETE',
    url: `${apiBaseUrl}/channel/asset`,
    body: { assetType }
  });

export const followChannel = async (followedUsername) =>
  await authFetch({
    method: 'PUT',
    url: `${apiBaseUrl}/channel/followingList/add`,
    body: { followedUsername }
  });

export const unfollowChannel = async (followedUsername) =>
  await authFetch({
    method: 'PUT',
    url: `${apiBaseUrl}/channel/followingList/remove`,
    body: { followedUsername }
  });

export const getStreamLiveStatus = async () =>
  await authFetch({
    method: 'GET',
    url: `${apiBaseUrl}/channel/stream/liveStatus`
  });
