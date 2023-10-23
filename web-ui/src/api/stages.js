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

export const getParticipationToken = async (stageId, participantType) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/createParticipantToken/${stageId}/${participantType}`
  });

export const disconnectFromStage = async () => {
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/stages/disconnect`,
    keepalive: true
  });
};
