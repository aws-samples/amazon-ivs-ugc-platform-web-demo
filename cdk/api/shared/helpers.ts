import {
  AttributeValueUpdate,
  DynamoDBClient,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

export const updateDynamoItemAttributes = ({
  attributes = [],
  dynamoDbClient,
  id,
  tableName
}: {
  attributes: { key: string; value: any }[];
  dynamoDbClient: DynamoDBClient;
  id: string;
  tableName: string;
}) => {
  if (!attributes.length) return;

  const attributesToUpdate = attributes.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: {
        Action: 'PUT',
        Value: convertToAttr(value, {
          removeUndefinedValues: true
        })
      }
    }),
    {}
  ) as { [key: string]: AttributeValueUpdate };

  const putItemCommand = new UpdateItemCommand({
    AttributeUpdates: attributesToUpdate,
    Key: { id: { S: id } },
    TableName: tableName
  });

  return dynamoDbClient.send(putItemCommand);
};
