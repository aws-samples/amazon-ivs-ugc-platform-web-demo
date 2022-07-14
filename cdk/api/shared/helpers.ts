import {
  AttributeValueUpdate,
  DynamoDBClient,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

type DynamoKey = { key: string; value: string };

export const updateDynamoItemAttributes = ({
  attributes = [],
  dynamoDbClient,
  primaryKey,
  sortKey,
  tableName
}: {
  attributes: { key: string; value: any }[];
  dynamoDbClient: DynamoDBClient;
  primaryKey: DynamoKey;
  sortKey?: DynamoKey;
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
    Key: {
      [primaryKey.key]: convertToAttr(primaryKey.value),
      ...(sortKey ? { [sortKey.key]: convertToAttr(sortKey.value) } : {})
    },
    TableName: tableName
  });

  return dynamoDbClient.send(putItemCommand);
};
