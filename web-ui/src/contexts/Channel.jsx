import { createContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import useSWR from 'swr';

import { CHANNEL_DATA_REFRESH_INTERVAL } from '../constants';
import { channelsAPI } from '../api';
import { getAvatarSrc } from '../helpers';
import { useUser } from './User';
import useContextHook from './useContextHook';
import useCurrentPage from '../hooks/useCurrentPage';

const Context = createContext(null);
Context.displayName = 'Channel';

const channelDataFetcher = async (username) => {
  const { result: data, error } =
    await channelsAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};

export const Provider = ({ children }) => {
  const { isSessionValid, userData } = useUser();
  const { username: channelUsername } = useParams();
  const currentPage = useCurrentPage();
  /**
   * We use userData.username in the SWR key to ensure that each channel data request
   * is associated with a unique user. Doing so ensures that the channel data is reset
   * whenever the user logs out or a new user logs in. This is essential as we need to
   * make sure that the value of isViewerBanned is always accurate for the user who is
   * signed in, and this can only be guaranteed if the SWR key is updated appropriately.
   * The SWR key is filtered to remove duplicate usernames so that duplicate data isn't
   * fetched by SWR.
   */
  let swrKey = null;
  if ((isSessionValid && userData) || isSessionValid === false) {
    if (currentPage === 'channel' && channelUsername) {
      const keyArr = [channelUsername, userData?.username];
      swrKey = keyArr.filter((item, i) => keyArr.indexOf(item) === i);
    } else if (currentPage !== 'channel' && userData) {
      swrKey = [userData?.username];
    }
  }

  const {
    data: channelData,
    error: channelError,
    mutate: refreshChannelData
  } = useSWR(swrKey, channelDataFetcher, {
    refreshInterval: CHANNEL_DATA_REFRESH_INTERVAL
  });
  const isChannelLoading = !channelData && !channelError;
  const avatarSrc = getAvatarSrc(channelData);
  const augmentedChannelData = useMemo(
    () => ({ ...channelData, avatarSrc }),
    [avatarSrc, channelData]
  );
  const value = useMemo(
    () => ({
      channelData: !!channelData ? augmentedChannelData : undefined,
      channelError,
      isChannelLoading,
      refreshChannelData
    }),
    [
      augmentedChannelData,
      channelData,
      channelError,
      isChannelLoading,
      refreshChannelData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChannel = () => useContextHook(Context);
