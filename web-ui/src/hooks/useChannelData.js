import useSWR from 'swr';

import { CHANNEL_DATA_REFRESH_INTERVAL } from '../constants';
import { channelAPI } from '../api';

const channelDataFetcher = async (username) => {
  const { result: data, error } = await channelAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};

const useChannelData = (username) => {
  const { data: channelData, error: channelError } = useSWR(
    username,
    channelDataFetcher,
    { refreshInterval: CHANNEL_DATA_REFRESH_INTERVAL }
  );
  const isChannelLoading = !channelData && !channelError;

  return {
    channelData,
    channelError,
    isChannelLoading
  };
};

export default useChannelData;
