import { apiBaseUrl, authFetch } from './utils';

export const createStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/create`
  });

export const deleteStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/delete`,
    method: 'PUT'
  });

export const getParticipationToken = async (stageId) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/createParticipantToken/${stageId}`
  });
