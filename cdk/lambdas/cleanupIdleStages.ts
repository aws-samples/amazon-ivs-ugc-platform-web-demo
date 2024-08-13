import { ListStagesCommand } from '@aws-sdk/client-ivs-realtime';

import {
  ivsRealTimeClient,
  getIdleStageArns,
  deleteStagesWithRetry,
  updateMultipleChannelDynamoItems,
  getBatchChannelWriteUpdates,
  getIdleStages
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
        // Filter list of stages by project
        const projectStages = stages.filter((stage) =>
          Object.entries(stage.tags || {}).some(([key, value]) => {
            return key === 'project' && value === process.env.PROJECT_TAG;
          })
        );
        const idleStages = getIdleStages(projectStages);
        const idleStageArns = getIdleStageArns(idleStages);
        const batchChannelWriteUpdates =
          getBatchChannelWriteUpdates(idleStages);
        await Promise.all([
          deleteStagesWithRetry(idleStageArns),
          updateMultipleChannelDynamoItems(batchChannelWriteUpdates)
        ]);
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
