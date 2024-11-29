import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useMap } from './hooks';
import {
  COLLABORATE_HOST_STATUS,
  updateCollaborateHost
} from '../../reducers/shared';

/**
 * The value for HOST_USER_ID_PREFIX must match the prefix value on the backend to identify the host participant
 * This can be found in the cdk-channel-stack "unpublishedParticipantRule"
 */
const HOST_USER_ID_PREFIX = 'host:';

function useParticipants(stageConfig) {
  const dispatch = useDispatch();
  const { participantGroup, participantId: localParticipantId } = stageConfig;
  const [stageParticipants, stageParticipantsMutators] = useMap();

  const participants = useMemo(() => {
    const participantsMap = new Map(Object.entries({}));

    // Augment participantsMap with the participant info collected from the Stage client events
    stageParticipants.forEach((participant, participantId) => {
      participantsMap.set(participantId, {
        ...participantsMap.get(participantId),
        ...participant
      });
    });

    // Ensure the local participant is the last participant in participantsMap
    const localParticipant = participantsMap.get(localParticipantId);
    if (localParticipant) {
      participantsMap.delete(localParticipant.id);
      participantsMap.set(localParticipant.id, localParticipant);
    }

    return participantsMap;
  }, [localParticipantId, stageParticipants]);

  const upsertParticipant = useCallback(
    (participant) => {
      const {
        attributes,
        id: participantId,
        userId,
        attributes: { username }
      } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      // The host participant has joined the stage session
      if (userId.includes(HOST_USER_ID_PREFIX)) {
        dispatch(
          updateCollaborateHost({
            username,
            status: COLLABORATE_HOST_STATUS.CONNECTED
          })
        );
      }

      stageParticipantsMutators.set(participantId, (prevParticipant) => {
        return {
          ...prevParticipant,
          ...participant
        };
      });
    },
    [dispatch, participantGroup, stageParticipantsMutators]
  );

  const removeParticipant = useCallback(
    (participant) => {
      const { attributes, id: participantId, userId } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      // The host participant has left the stage session
      if (userId.includes(HOST_USER_ID_PREFIX)) {
        dispatch(
          updateCollaborateHost({
            status: COLLABORATE_HOST_STATUS.DISCONNECTED
          })
        );
      }

      stageParticipantsMutators.remove(participantId);
    },
    [dispatch, participantGroup, stageParticipantsMutators]
  );

  return {
    participants,
    upsertParticipant,
    removeParticipant,
    resetParticipants: stageParticipantsMutators.clear
  };
}

export default useParticipants;
