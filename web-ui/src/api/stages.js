import { apiBaseUrl, authFetch, unauthFetch } from './utils';

export const getSpectatorToken = async (stageId) =>
  await unauthFetch({
    url: `${apiBaseUrl}/stages/createSpectatorToken/${stageId}`
  });

export const getStage = async (stageId) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/${stageId}`
  });

export const createStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/create`
  });

export const endStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/end`,
    method: 'PUT'
  });

export const getParticipationToken = async ({ stageId, participantType }) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/createParticipantToken/${stageId}/${participantType}`
  });

export const disconnectParticipant = async ({
  participantId,
  displayParticipantId = ''
}) => {
  return await authFetch({
    url: `${apiBaseUrl}/stages/disconnectParticipant`,
    method: 'PUT',
    body: { participantId, displayParticipantId }
  });
};
