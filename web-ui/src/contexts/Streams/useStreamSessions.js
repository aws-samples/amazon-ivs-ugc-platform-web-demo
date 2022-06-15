import { useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { STREAM_SESSIONS_REFRESH_INTERVAL } from '../../constants';

import useStateWithCallback from '../../hooks/useStateWithCallback';
import { streamSessionsFetcher } from './fetchers';

const useStreamSessions = ({ isSessionValid, userData }) => {
  const [streamSessions, setStreamSessions] = useStateWithCallback();
  const [canLoadMoreStreamSessions, setCanLoadMoreStreamSessions] =
    useState(true);
  const [isLoadingNextStreamSessionsPage, setIsLoadingNextStreamSessionsPage] =
    useState(false);
  const hasStreamSessions = !streamSessions
    ? undefined
    : streamSessions.length > 0;

  const latestStreamSessionPage = useRef();
  // By default, useSWRInfinite will revalidate the first page, which will trigger a downstream
  // revalidation of all the subsequent pages as well.
  const {
    error: fetchStreamSessionsError,
    isValidating: isValidatingStreamSessions,
    setSize,
    mutate: refreshCurrentStreamSessions
  } = useSWRInfinite(
    // This function is called before each fetcher request.
    // It is also triggered by a call to setSize().
    (pageIndex, previousPageData) => {
      if (!isSessionValid || !userData) return null;

      if (previousPageData && !previousPageData.nextToken) return null; // reached the end of the stream sessions list

      /**
       * The value of nextToken will change on every fetch. Therefore, we cannot use it directly as a reliable key parameter.
       * Whenever we try to load more pages, only the first page is revalidated. Since we expect new sessions to be added to
       * the top of the first page only, we can simply check whether or not the first stream ID has changed since the previous
       * revalidation.
       *
       * If the first stream ID has changed, then we must revalidate the first page. SWR will then see that all the subsequent
       * page keys have changed, and revalidate those pages as well.
       *
       * Otherwise, we will use the same token as the previous fetch so that SWR knows this is the same key and will not
       * revalidate the subsequent pages.
       */
      if (pageIndex === 1) {
        const {
          streamSessions: latestStreamSessions,
          nextToken: latestNextToken
        } = latestStreamSessionPage.current;
        const latestStreamId = latestStreamSessions[0].streamId;
        const previousStreamSession = previousPageData.streamSessions[0];
        const previousStreamId = previousStreamSession.streamId;

        if (previousStreamId !== latestStreamId) {
          // We have at least one new stream, so we must revalidate this page
          latestStreamSessionPage.current = previousPageData;

          return [userData.channelResourceId, previousPageData.nextToken];
        } else {
          // We have no new stream, so we will not revalidate this page
          return [userData.channelResourceId, latestNextToken];
        }
      }

      if (previousPageData && previousPageData.nextToken) {
        return [userData.channelResourceId, previousPageData.nextToken]; // fetch the next page of stream sessions
      }

      return [userData.channelResourceId]; // fetch the first page
    },
    streamSessionsFetcher,
    {
      dedupingInterval: 1000,
      fallbackData: [],
      refreshInterval: STREAM_SESSIONS_REFRESH_INTERVAL,
      revalidateOnMount: true,
      onError: () => {
        setIsLoadingNextStreamSessionsPage(false);
      },
      onSuccess: (sessionPages) => {
        const [firstPage] = sessionPages;
        const { maxResults } = firstPage;
        const firstStreamId = firstPage?.streamSessions[0]?.streamId;

        if (
          firstStreamId !==
          latestStreamSessionPage.current?.streamSessions[0]?.streamId
        ) {
          latestStreamSessionPage.current = firstPage;
        }

        const nextSessions = sessionPages
          .reduce((sessionsAcc, { streamSessions }) => {
            return [...sessionsAcc, ...streamSessions];
          }, [])
          .map((session, index) => ({ ...session, index }));

        const { nextToken: latestToken } =
          sessionPages[sessionPages.length - 1];
        setCanLoadMoreStreamSessions(!!latestToken);

        setStreamSessions((prevSessions) => {
          if (!prevSessions) return nextSessions;

          const streamIds = new Set(
            [...nextSessions, ...prevSessions].map(({ streamId }) => streamId)
          );

          // Merge previous stream data with the new stream data we just fetched
          const mergedSessions = [...streamIds].map((streamId) => {
            const prevSession =
              prevSessions.find((session) => session.streamId === streamId) ||
              {};
            const nextSession =
              nextSessions.find((session) => session.streamId === streamId) ||
              {};

            return { ...prevSession, ...nextSession };
          });

          const shouldUpdateStreams =
            nextSessions.length !== prevSessions.length ||
            JSON.stringify(nextSessions) !== JSON.stringify(prevSessions);
          const newSessions = shouldUpdateStreams
            ? mergedSessions
            : prevSessions;

          const prevSize = Math.ceil(prevSessions.length / maxResults);
          const nextSize = Math.ceil(newSessions.length / maxResults);

          // Calling setSize will force revalidation even if the value doesn't change
          if (prevSize !== nextSize) {
            setSize(nextSize);
          }

          return newSessions;
        });

        setIsLoadingNextStreamSessionsPage(false);
      },
      shouldRetryOnError: false
    }
  );

  return {
    canLoadMoreStreamSessions,
    fetchStreamSessionsError,
    hasStreamSessions,
    isLoadingNextStreamSessionsPage,
    isValidatingStreamSessions,
    refreshCurrentStreamSessions,
    setIsLoadingNextStreamSessionsPage,
    setSize,
    setStreamSessions,
    streamSessions
  };
};

export default useStreamSessions;
