import { useMemo, useState } from 'react';
import { STREAM_SESSION_DATA_REFRESH_INTERVAL } from '../../constants';
import useSWRWithKeyUpdate from '../../hooks/useSWRWithKeyUpdate';
import { activeStreamSessionFetcher } from './fetchers';

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
  const {
    error: fetchActiveStreamSessionError,
    isValidating: isValidatingActiveStreamSession,
    // updateActiveStreamSession is used to change the key that SWR is using to poll the data.
    // Here, the key contains the streamId of the selected session. It is used as an URL parameter when calling the API.
    updateKey: updateActiveStreamSession,
    // refreshCurrentActiveStreamSession is used to manually poll new data based on a user interaction after an error occurred with a previous data fetching.
    // It does not update the key and polls for the currently selected session.
    mutate: refreshCurrentActiveStreamSession
  } = useSWRWithKeyUpdate(
    userData && isSessionValid && userData.channelResourceId,
    activeStreamSessionFetcher,
    {
      refreshInterval: isLive ? STREAM_SESSION_DATA_REFRESH_INTERVAL : 0,
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
                    streamId: streamSessionMetadata.streamId
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
