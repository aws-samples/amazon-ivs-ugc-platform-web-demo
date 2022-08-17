import useSWR from 'swr';

import { channelAPI } from '../api';
import { CHANNEL_DATA_REFRESH_INTERVAL } from '../constants';

const channelDataFetcher = async (username) => {
  const { result: data, error } = await channelAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};

const useChannelData = (username) => {
  const { data, error } = useSWR(username, channelDataFetcher, {
    refreshInterval: CHANNEL_DATA_REFRESH_INTERVAL
  });

  return { data, error };
};

export default useChannelData;
