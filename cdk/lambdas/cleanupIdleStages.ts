import { ListStagesCommand } from '@aws-sdk/client-ivs-realtime';

import {
  ivsRealTimeClient,
  getIdleStageArns,
  deleteStagesWithRetry
} from './helpers';

export const handler = async () => {
  try {
    const deleteIdleStages = async (nextToken = '') => {
      const listStagesCommand = new ListStagesCommand({
        maxResults: 100,
        nextToken
      });
      const response = await ivsRealTimeClient.send(listStagesCommand);

      const stages = response?.stages || [];
      const _nextToken = response?.nextToken || '';

      if (stages.length) {
        const idleStageArns = getIdleStageArns(stages);
        await deleteStagesWithRetry(idleStageArns);
      }

      if (_nextToken) await deleteIdleStages(_nextToken);
    };

    await deleteIdleStages();
  } catch (error) {
    console.error(error);

    throw new Error('Failed to remove idle stages due to unexpected error');
  }
};

export default handler;
