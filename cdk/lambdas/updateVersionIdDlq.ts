import { SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
  console.log(`DLQ: ${JSON.stringify({ event })}`);
};
