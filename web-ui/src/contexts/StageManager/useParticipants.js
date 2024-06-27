import { useCallback, useMemo } from 'react';
import { useMap } from './hooks';

function useParticipants(stageConfig) {
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
      const { attributes, id: participantId } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      stageParticipantsMutators.set(participantId, (prevParticipant) => {
        return {
          ...prevParticipant,
          ...participant
        };
      });
    },
    [participantGroup, stageParticipantsMutators]
  );

  const removeParticipant = useCallback(
    (participant) => {
      const { attributes, id: participantId } = participant;

      if (attributes.participantGroup !== participantGroup) {
        return;
      }

      stageParticipantsMutators.remove(participantId);
    },
    [participantGroup, stageParticipantsMutators]
  );

  return {
    participants,
    upsertParticipant,
    removeParticipant,
    resetParticipants: stageParticipantsMutators.clear
  };
}

export default useParticipants;
