import {
  AdminDeleteUserCommand,
  ListUsersCommand,
  UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { WriteRequest } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

import {
  batchDeleteItemsWithRetry,
  cognitoClient,
  convertToChunks
} from './helpers';

const { CHANNELS_TABLE_NAME: channelsTableName, USER_POOL_ID: userPoolId } =
  process.env;

export const handler = async () => {
  try {
    if (!channelsTableName || !userPoolId)
      throw new Error(
        'Missing required variables: channelsTableName or userPoolId are not defined.'
      );

    const deletedCognitoUserSubs: string[] = [];
    let listUnconfirmedUsers: UserType[] = [];
    let paginationToken: string | undefined;

    const getUnconfirmedUsers = async () => {
      const listUnconfirmedUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: 'cognito:user_status ="UNCONFIRMED"',
        PaginationToken: paginationToken,
        AttributesToGet: ['sub']
      });

      const listUnconfirmedUsersResponse = await cognitoClient.send(
        listUnconfirmedUsersCommand
      );

      if (listUnconfirmedUsersResponse?.Users) {
        listUnconfirmedUsers = [
          ...listUnconfirmedUsers,
          ...listUnconfirmedUsersResponse.Users
        ];
      }
      paginationToken =
        listUnconfirmedUsersResponse.PaginationToken || undefined;

      if (paginationToken) await getUnconfirmedUsers();
    };

    await getUnconfirmedUsers();

    if (listUnconfirmedUsers.length === 0) return;

    // Filter users created at least 24 hours ago
    const expiredUnconfirmedCognitoUsers =
      listUnconfirmedUsers.filter((cognitoUser) => {
        const { UserCreateDate = '' } = cognitoUser;
        if (!UserCreateDate) return false;
        const millisecondsInOneDay = 60 * 60 * 24 * 1000;

        const timeElapsedSinceCreation =
          new Date().getTime() - new Date(UserCreateDate).getTime();

        return Math.abs(timeElapsedSinceCreation) > millisecondsInOneDay;
      }) || [];

    if (expiredUnconfirmedCognitoUsers.length === 0) return;

    // Delete unverified Cognito users created 24 hours or more ago in parallel
    const deleteCognitoUserPromises = expiredUnconfirmedCognitoUsers.map(
      ({ Username, Attributes }) => {
        const subAttribute = Attributes?.find(
          (attribute) => attribute.Name === 'sub'
        );

        return new Promise(async (resolve, rejects) => {
          try {
            if (!Username || !subAttribute || !subAttribute.Value) return;

            const deleteUserCommand = new AdminDeleteUserCommand({
              UserPoolId: userPoolId,
              Username
            });
            const response = await cognitoClient.send(deleteUserCommand);
            deletedCognitoUserSubs.push(subAttribute.Value);
            resolve(response);
          } catch (err) {
            console.error(err);
            rejects({});
          }
        });
      }
    );
    await Promise.allSettled(deleteCognitoUserPromises);

    if (deletedCognitoUserSubs.length) {
      // Batch delete a maximum of 25 items at a time from DynamoDB.
      const deleteRequests = deletedCognitoUserSubs.reduce((acc, userSubs) => {
        return [
          ...acc,
          {
            DeleteRequest: {
              Key: marshall({
                id: userSubs
              })
            }
          }
        ];
      }, [] as WriteRequest[]);

      const deleteRequestChunks = convertToChunks(deleteRequests, 25);

      for (const chunkIndex in deleteRequestChunks) {
        await batchDeleteItemsWithRetry({
          [channelsTableName]: deleteRequestChunks[chunkIndex]
        });
      }
    }
  } catch (error) {
    console.error(error);

    throw new Error(
      'Failed to remove unverified users due to unexpected error'
    );
  }
};

export default handler;
