import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import useSWR from 'swr';

import { channelAPI } from '../api';
import { getAvatarSrc } from '../helpers';
import { getCurrentSession } from '../api/utils';
import { pack, unpack } from '../helpers/streamActionHelpers';
import useContextHook from './useContextHook';
import useCurrentPage from '../hooks/useCurrentPage';
import useLocalStorage from '../hooks/useLocalStorage';
import usePrevious from '../hooks/usePrevious';

const Context = createContext(null);
Context.displayName = 'User';

const getCurrentSessionFetcher = async () => {
  const { result: data, error } = await getCurrentSession();

  if (error) throw error;

  return data;
};

export const Provider = ({ children }) => {
  const [isCreatingResources, setIsCreatingResources] = useState(false);
  const [hasErrorCreatingResources, setHasErrorCreatingResources] =
    useState(false);
  const [userData, setUserData] = useState();
  const [hasFetchedInitialUserData, setHasFetchedInitialUserData] =
    useState(false);
  const [isSessionValid, setIsSessionValid] = useState();
  const [logOutAction, setLogOutAction] = useState('');
  const [hasErrorFetchingFollowingList, setHasErrorFetchingFollowingList] =
    useState(false);
  const prevIsSessionValid = usePrevious(isSessionValid);
  const avatarSrc = getAvatarSrc(userData);

  const currentPage = useCurrentPage();
  const hasUserData = !!userData;

  const { remove: removeStoredUserData } = useLocalStorage({
    key: userData?.username,
    options: { keyPrefix: 'user', serialize: pack, deserialize: unpack }
  });

  const {
    data: session,
    mutate: checkSessionStatus, // mutate forces refetching the data, we use it after login and after logout
    error
  } = useSWR('getCurrentSession', getCurrentSessionFetcher);

  const fetchUserData = useCallback(async () => {
    const { result } = await channelAPI.getUserData();
    setHasFetchedInitialUserData(true);

    if (result) {
      setUserData(
        (prevUserData) =>
          JSON.stringify(result) === JSON.stringify(prevUserData)
            ? prevUserData // userData is the same, no need to re-render any downstream context subscribers
            : result // userData changed, so we must re-render all downstream context subscribers
      );
    }

    return result;
  }, []);

  const fetchUserFollowingList = useCallback(async () => {
    setHasErrorFetchingFollowingList(false);

    const { result, error } = await channelAPI.getUserFollowingListData();

    if (result) {
      setUserData((prevUserData) => ({
        ...prevUserData,
        followingList: result.channels
      }));
    }
    if (error) setHasErrorFetchingFollowingList(true);
  }, []);

  // Initialize user resources
  const initUserResources = useCallback(async () => {
    if (await fetchUserData()) return;

    setIsCreatingResources(true);
    setHasErrorCreatingResources(false);
    const { result, error } = await channelAPI.createResources();

    if (result) await fetchUserData();
    if (error) setHasErrorCreatingResources(true);

    setIsCreatingResources(false);
  }, [fetchUserData]);

  const logOut = useCallback(
    (action) => {
      setLogOutAction(action);
      channelAPI.signOut();
      checkSessionStatus();
      setUserData(null);
      setHasFetchedInitialUserData(false);
    },
    [checkSessionStatus]
  );

  // Initial session check on page load
  useEffect(() => {
    if (error) {
      setIsSessionValid(false);
    } else if (session !== undefined) {
      setIsSessionValid(!!session);
    }
  }, [error, session]);

  // Initial fetch of the user data
  useEffect(() => {
    if (!userData && isSessionValid) {
      fetchUserData();
    }
  }, [fetchUserData, isSessionValid, userData]);

  // Remove all stored user data when the session becomes invalid
  // (i.e. user logs out, user session expires, etc.)
  useEffect(() => {
    if (isSessionValid === false) {
      removeStoredUserData(true);
    }
  }, [isSessionValid, removeStoredUserData]);

  useEffect(() => {
    if (
      hasUserData &&
      ['channel_directory', 'following'].includes(currentPage)
    ) {
      fetchUserFollowingList();
    }
  }, [currentPage, fetchUserFollowingList, hasUserData]);

  const value = useMemo(
    () => ({
      checkSessionStatus,
      fetchUserData,
      fetchUserFollowingList,
      hasErrorCreatingResources,
      hasErrorFetchingFollowingList,
      hasFetchedInitialUserData,
      initUserResources,
      isCreatingResources,
      isSessionValid,
      logOut,
      logOutAction,
      prevIsSessionValid,
      userData: userData && { ...userData, avatarSrc }
    }),
    [
      avatarSrc,
      checkSessionStatus,
      fetchUserData,
      fetchUserFollowingList,
      hasErrorCreatingResources,
      hasErrorFetchingFollowingList,
      hasFetchedInitialUserData,
      initUserResources,
      isCreatingResources,
      isSessionValid,
      logOut,
      logOutAction,
      prevIsSessionValid,
      userData
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useUser = () => useContextHook(Context);
