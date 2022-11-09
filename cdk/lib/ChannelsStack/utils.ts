import { join } from 'path';

export const getLambdaEntryPath = (functionPath: string) =>
  join(__dirname, '../..', 'lambdas', `${functionPath}.ts`);
