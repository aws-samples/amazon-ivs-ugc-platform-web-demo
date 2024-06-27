import { useMap } from './hooks';
import { deepEqual } from 'fast-equals';
import { useCallback, useEffect } from 'react';

const { StreamType } = window.IVSBroadcastClient;

function useStreams(stageConfig) {
  const { participantId: localParticipantId } = stageConfig || {};
  const [stageStreams, stageStreamsMutators] = useMap();
  const [mediaStreams, mediaStreamsMutators] = useMap();
  const [streamMetadata, streamMetadataMutators] = useMap();

  const toggleStageStreamMutedState = useCallback(
    (participantId, streamType, muted) => {
      const streams = stageStreams.get(participantId);
      const stream = streams?.find((s) => s.streamType === streamType);

      if (stream) {
        stream.setMuted(muted ?? !stream.isMuted);

        return stream.isMuted;
      }
    },
    [stageStreams]
  );

  const toggleLocalStageStreamMutedState = useCallback(
    (streamType, muted) => {
      return toggleStageStreamMutedState(localParticipantId, streamType, muted);
    },
    [localParticipantId, toggleStageStreamMutedState]
  );

  const upsertStreams = useCallback(
    (participant, streams) => {
      const streamsToUpsert = [streams].flat();
      stageStreamsMutators.set(participant.id, (prevStageStreams = []) =>
        streamsToUpsert.reduce((nextStageStreams, streamToUpsert) => {
          const nextStreams = nextStageStreams.concat();
          const streamIndex = nextStreams.findIndex(
            (stream) => stream.streamType === streamToUpsert.streamType
          );

          if (streamIndex === -1) {
            // insert stream
            nextStreams.push(streamToUpsert);
          } else {
            // update stream
            nextStreams[streamIndex] = streamToUpsert;
          }

          return nextStreams;
        }, prevStageStreams)
      );
    },
    [stageStreamsMutators]
  );

  const removeStreams = useCallback(
    (participant, streams) => {
      const streamsToRemove = [streams].flat();
      stageStreamsMutators.set(participant.id, (prevStageStreams = []) =>
        prevStageStreams.filter((prevStageStream) => {
          const streamIndex = streamsToRemove.findIndex(
            (removedStream) =>
              prevStageStream.streamType === removedStream.streamType
          );

          return streamIndex === -1;
        })
      );
    },
    [stageStreamsMutators]
  );

  const resetStreams = useCallback(() => {
    mediaStreamsMutators.clear();
    stageStreamsMutators.clear();
    streamMetadataMutators.clear();
  }, [mediaStreamsMutators, stageStreamsMutators, streamMetadataMutators]);

  // Update the media stream containers when changes have been made to the stage streams
  useEffect(() => {
    stageStreams.forEach((streams, participantId) => {
      const mediaStream = mediaStreams.get(participantId) || new MediaStream();
      const mediaStreamTracks = mediaStream.getTracks();
      const stageStreamTracks = streams.map((st) => st.mediaStreamTrack); // "source-of-truth"

      // Remove tracks that are in nextMediaStreamTracks but not in stageStreamTracks
      for (const mediaStreamTrack of mediaStreamTracks) {
        if (!stageStreamTracks.includes(mediaStreamTrack)) {
          mediaStream.removeTrack(mediaStreamTrack);
        }
      }

      // Add tracks that are in nextTracks but not in nextMediaStreamTracks
      for (const stageStreamTrack of stageStreamTracks) {
        if (!mediaStreamTracks.includes(stageStreamTrack)) {
          mediaStream.addTrack(stageStreamTrack);
        }
      }

      if (mediaStream.active) {
        mediaStreamsMutators.set(participantId, mediaStream);
        streamMetadataMutators.set(participantId, (prevMetadata) => {
          const videoTrack = mediaStream.getVideoTracks()[0];
          const videoStream = streams.find(
            (st) => st.streamType === StreamType.VIDEO
          );
          const audioOnly = !videoTrack || !videoStream || videoStream.isMuted;
          const metadata = { audioOnly };

          return prevMetadata && deepEqual(metadata, prevMetadata)
            ? prevMetadata
            : metadata;
        });
      } else {
        mediaStreamsMutators.remove(participantId);
        stageStreamsMutators.remove(participantId);
        streamMetadataMutators.remove(participantId);
      }
    });
  }, [
    mediaStreams,
    mediaStreamsMutators,
    stageStreams,
    stageStreamsMutators,
    streamMetadataMutators
  ]);

  return {
    mediaStreams,
    upsertStreams,
    removeStreams,
    resetStreams,
    streamMetadata,
    toggleLocalStageStreamMutedState
  };
}

export default useStreams;
