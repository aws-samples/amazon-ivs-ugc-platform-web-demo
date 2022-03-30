import { join } from 'path';

export const getLambdaEntryPath = (functionName: string) =>
  join(__dirname, '..', 'lambdas', `${functionName}.ts`);
