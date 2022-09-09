import { createContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import useSWR from 'swr';

import { CHANNEL_DATA_REFRESH_INTERVAL } from '../constants';
import { channelAPI } from '../api';
import { useUser } from './User';
import useContextHook from './useContextHook';
import useCurrentPage from '../hooks/useCurrentPage';

const Context = createContext(null);
Context.displayName = 'Channel';

const channelDataFetcher = async (username) => {
  const { result: data, error } = await channelAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};

export const Provider = ({ children }) => {
  const { userData } = useUser();
  const { username: channelUsername } = useParams();
  const currentPage = useCurrentPage();
  /**
   * We use userData.username in the SWR key to ensure that each channel data request
   * is associated with a unique user. Doing so ensures that the channel data is reset
   * whenever the user logs out or a new user logs in. This is essential as we need to
   * make sure that the value of isViewerBanned is always accurate for the user who is
   * signed in, and this can only be guranteed if the SWR key is updated appropriately.
   */
  const swrKey =
    currentPage === 'channel' ? [channelUsername, userData?.username] : null;
  const {
    data: channelData,
    error: channelError,
    mutate: refreshChannelData
  } = useSWR(swrKey, channelDataFetcher, {
    refreshInterval: CHANNEL_DATA_REFRESH_INTERVAL
  });
  const isChannelLoading =
    currentPage === 'channel' && !channelData && !channelError;

  const value = useMemo(
    () => ({
      channelData,
      channelError,
      isChannelLoading,
      refreshChannelData
    }),
    [channelData, channelError, isChannelLoading, refreshChannelData]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChannel = () => useContextHook(Context);
