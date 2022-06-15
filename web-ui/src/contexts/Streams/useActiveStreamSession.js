import { useMemo, useState } from 'react';

import { activeStreamSessionFetcher } from './fetchers';
import { STREAM_SESSION_DATA_REFRESH_INTERVAL } from '../../constants';
import useSWRWithKeyUpdate from '../../hooks/useSWRWithKeyUpdate';

const useActiveStreamSession = ({
  isLive,
  isSessionValid,
  setStreamSessions,
  streamSessions,
  userData
}) => {
  const [activeStreamSessionId, setActiveStreamSessionId] = useState();
  const activeStreamSession = useMemo(
    () =>
      streamSessions?.find(
        ({ streamId }) => streamId === activeStreamSessionId
      ),
    [activeStreamSessionId, streamSessions]
  );

  const setStale = (streamId) => (isStale) => {
    setStreamSessions((prevSessions) => {
      let shouldUpdateStreams = false;

      const nextSessions = prevSessions.map((stream) => {
        if (stream.streamId === streamId) {
          shouldUpdateStreams = true;
          return { ...stream, isStale };
        }
        return stream;
      });

      return shouldUpdateStreams ? nextSessions : prevSessions;
    });
  };

  const {
    error: fetchActiveStreamSessionError,
    isValidating: isValidatingActiveStreamSession,
    /**
     * updateActiveStreamSession is used to change the key that SWR is using to poll the data.
     * Here, the key contains the streamId of the selected session. It is used as an URL parameter when calling the API.
     */
    updateKey: updateActiveStreamSession,
    /**
     * refreshCurrentActiveStreamSession is used to manually poll new data based on a user interaction after an error occurred with a previous data fetching.
     * It does not update the key and polls for the currently selected session.
     * Important: calling this function will bypass the frozen state and refresh the current active session anyways
     */
    mutate: refreshCurrentActiveStreamSession
  } = useSWRWithKeyUpdate(
    userData && isSessionValid && userData.channelResourceId,
    activeStreamSessionFetcher,
    {
      refreshInterval: isLive ? STREAM_SESSION_DATA_REFRESH_INTERVAL : 0, // Disabled when refreshInterval = 0
      revalidateOnFocus: isLive,
      revalidateOnReconnect: isLive,
      revalidateOnMount: true,
      dedupingInterval: 0,
      onSuccess: (streamSessionMetadata) => {
        setStreamSessions(
          (prevStreamSessions) =>
            prevStreamSessions?.map((prevStreamSession) =>
              prevStreamSession.streamId === streamSessionMetadata.streamId
                ? {
                    ...prevStreamSession,
                    ...streamSessionMetadata,
                    isLive: !prevStreamSession.endTime, // Attach a live indicator to the stream session for convenience
                    isMetadataFetched: true,
                    streamId: streamSessionMetadata.streamId,
                    setStale: setStale(streamSessionMetadata.streamId)
                  }
                : prevStreamSession
            ),
          () => setActiveStreamSessionId(streamSessionMetadata.streamId)
        );
      },
      shouldRetryOnError: false
    }
  );

  return {
    activeStreamSession,
    fetchActiveStreamSessionError,
    isValidatingActiveStreamSession,
    refreshCurrentActiveStreamSession,
    setActiveStreamSessionId,
    updateActiveStreamSession
  };
};

export default useActiveStreamSession;
