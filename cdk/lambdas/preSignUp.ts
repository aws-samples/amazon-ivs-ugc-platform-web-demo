import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { PreSignUpTriggerHandler } from 'aws-lambda';

import { EMAIL_EXISTS_ERROR } from './constants';

const dynamoDbClient = new DynamoDBClient({});

export const handler: PreSignUpTriggerHandler = async (event) => {
  const { email: signupEmail = '' } = event.request.userAttributes;

  if (signupEmail) {
    const queryCommand = new QueryCommand({
      IndexName: 'emailIndex',
      TableName: process.env.USER_TABLE_NAME,
      Limit: 1,
      KeyConditionExpression: 'email = :signupEmail',
      ExpressionAttributeValues: { ':signupEmail': { S: signupEmail } }
    });

    try {
      const { Items } = await dynamoDbClient.send(queryCommand);

      if (Items && Items.length > 0) {
        throw (new Error(EMAIL_EXISTS_ERROR), null);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * When ENABLE_USER_AUTO_VERIFY is set to "true", all users will be auto-verified.
   * It is not recommend to use it in a production environment.
   */
  if (process.env.ENABLE_USER_AUTO_VERIFY === 'true') {
    event.response.autoConfirmUser = true;

    if (signupEmail) {
      event.response.autoVerifyEmail = true;
    }
  }

  return event;
};
