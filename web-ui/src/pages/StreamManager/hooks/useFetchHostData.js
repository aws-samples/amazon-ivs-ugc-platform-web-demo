import { useState } from 'react';
import { HOST_CHANNEL_FETCHER_REFRESH_INTERVAL } from '../../../constants';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import { channelDataFetcher } from '../../../utils';

/**
 * Usage of this hook allows components to easily access and manage host channel data
 * while providing control over when to use SWR to fetch for optimal performance.
 *
 * This hook provides functionality to fetch host channel data based on certain conditions:
 * - It uses the Redux store to access the host's username from the collaborate state.
 * - It allows control over when to fetch data through a `shouldFetchHostData` state.
 * - It utilizes SWR (stale-while-revalidate) for data fetching with a specified refresh interval.
 *
 * The hook returns:
 * - hostChannelData: The fetched host's channel data.
 * - fetchHostChannelError: Any error that occurred during fetching.
 * - setShouldFetchHostData: A function to control when data fetching should occur.
 */

const useFetchHostData = () => {
  const { collaborate } = useSelector((state) => state.shared);
  const [shouldFetchHostData, setShouldFetchHostData] = useState(false);

  const { data: hostChannelData, error: fetchHostChannelError } = useSWR(
    shouldFetchHostData && collaborate.host.username
      ? [collaborate.host.username]
      : null,
    channelDataFetcher,
    {
      refreshInterval: HOST_CHANNEL_FETCHER_REFRESH_INTERVAL
    }
  );

  return { hostChannelData, fetchHostChannelError, setShouldFetchHostData };
};

export default useFetchHostData;
