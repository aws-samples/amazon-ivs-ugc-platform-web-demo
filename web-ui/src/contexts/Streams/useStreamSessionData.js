import { useCallback } from 'react';

import { noop } from '../../utils';
import { STREAM_SESSION_DATA_REFRESH_INTERVAL } from '../../constants';
import { streamSessionDataFetcher } from './fetchers';
import { useUser } from '../User';
import useSWRWithKeyUpdate from '../../hooks/useSWRWithKeyUpdate';

const useStreamSessionData = ({
  isLive,
  isRevalidationEnabled = true,
  setStreamSessions,
  onSuccess = noop
}) => {
  const { isSessionValid, userData } = useUser();

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
    error: fetchStreamSessionDataError,
    isValidating: isValidatingStreamSessionData,
    /**
     * updateKey is used to change the key that SWR is using to poll the data.
     * Here, the key contains a stream object with the streamId of the selected session. It is used as a URL parameter when calling the API.
     */
    updateKey,
    /**
     * refreshCurrentStreamSessionData is used to manually poll new data based on a user interaction after an error occurred with a previous data fetching.
     * It does not update the key and polls for the currently selected session.
     * Important: calling this function will bypass the frozen state and refresh the current stream session data anyways
     */
    mutate: refreshCurrentStreamSessionData,
    swrKey
  } = useSWRWithKeyUpdate({
    baseKey: userData && isSessionValid && userData.channelResourceId,
    fetcher: streamSessionDataFetcher,
    isEnabled: isRevalidationEnabled,
    options: {
      refreshInterval: isLive ? STREAM_SESSION_DATA_REFRESH_INTERVAL : 0, // Disabled when refreshInterval = 0
      revalidateOnFocus: isLive,
      revalidateOnReconnect: isLive,
      revalidateOnMount: true,
      revalidateIfStale: false,
      dedupingInterval: 0,
      onSuccess: (streamSessionMetadata) => {
        setStreamSessions(
          (prevStreamSessions) =>
            prevStreamSessions?.map((prevStreamSession) =>
              prevStreamSession.streamId === streamSessionMetadata.streamId
                ? {
                    ...prevStreamSession,
                    ...streamSessionMetadata,
                    isMetadataFetched: true,
                    streamId: streamSessionMetadata.streamId,
                    setStale: setStale(streamSessionMetadata.streamId)
                  }
                : prevStreamSession
            ),
          () => onSuccess(streamSessionMetadata)
        );
      },
      shouldRetryOnError: false
    }
  });

  const updateStreamSessionDataFetchKey = useCallback(
    (stream) => {
      const { streamId: fetchKeyStreamId } = swrKey?.[1] || {};

      if (fetchKeyStreamId !== stream.streamId) {
        updateKey(stream);
      }
    },
    [swrKey, updateKey]
  );

  return {
    fetchStreamSessionDataError,
    isValidatingStreamSessionData,
    refreshCurrentStreamSessionData,
    updateStreamSessionDataFetchKey
  };
};

export default useStreamSessionData;
