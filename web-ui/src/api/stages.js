import { apiBaseUrl, authFetch, unauthFetch } from './utils';

export const getSpectatorToken = async (userStageId, displayStageId) =>
  await unauthFetch({
    url: `${apiBaseUrl}/stages/createSpectatorToken/${userStageId}/${displayStageId}`
  });

export const getStage = async (stageId) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/${stageId}`
  });

export const createStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/create`
  });

export const deleteStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/delete`,
    method: 'PUT'
  });

export const getParticipationToken = async ({
  userStageId,
  displayStageId,
  participantType
}) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/createParticipantToken/${userStageId}/${displayStageId}/${participantType}`
  });

export const sendHostDisconnectedMessage = async (hostChannelId) => {
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
    keepalive: true,
    body: {
      hostChannelId
    }
  });
};

export const disconnectParticipant = async (participantId) => {
  return await authFetch({
    url: `${apiBaseUrl}/stages/disconnectParticipant`,
    method: 'PUT',
    body: { participantId }
  });
};
