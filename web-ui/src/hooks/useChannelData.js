import useSWR from 'swr';

import { CHANNEL_DATA_REFRESH_INTERVAL } from '../constants';
import { channelAPI } from '../api';
import { useUser } from '../contexts/User';

const channelDataFetcher = async (username) => {
  const { result: data, error } = await channelAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};

const useChannelData = (channelUsername) => {
  const { userData } = useUser();
  /**
   * We use userData.username in the SWR key to ensure that each channel data request
   * is associated with a unique user. Doing so ensures that the channel data is reset
   * whenever the user logs out or a new user logs in. This is essential as we need to
   * make sure that the value of isViewerBanned is always accurate for the user who is
   * signed in, and this can only be guranteed if the SWR key is updated appropriately.
   */
  const swrKey = [channelUsername, userData?.username];
  const {
    data: channelData,
    error: channelError,
    mutate: refreshChannelData
  } = useSWR(swrKey, channelDataFetcher, {
    refreshInterval: CHANNEL_DATA_REFRESH_INTERVAL
  });
  const isChannelLoading = !channelData && !channelError;

  return {
    channelData,
    channelError,
    isChannelLoading,
    refreshChannelData
  };
};

export default useChannelData;
