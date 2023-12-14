import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';

import useContextHook from '../../contexts/useContextHook';
import useLocalStorage from '../../hooks/useLocalStorage';
import { extractChannelIdfromChannelArn } from '../../utils';
import { pack, unpack } from '../../helpers/streamActionHelpers';
import { useChannel } from '../Channel';
import { useUser } from '../User';
import { useLocation } from 'react-router-dom';
import {
  NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS,
  EXTRA_TIME_TO_WAIT_FOR_END_POLL_EVENT
} from '../../constants';

const COMPOSER_HEIGHT = 92;
const SPACE_BETWEEN_COMPOSER_AND_POLL = 100;

const Context = createContext(null);
Context.displayName = 'Poll';

const POLL_TAB_LABEL = 'Live poll';

const initialPollProps = {
  votes: [],
  question: null,
  isActive: false,
  duration: 0,
  expiry: null,
  startTime: null,
  delay: 0
};

const initialPollState = {
  isSubmitting: false,
  isVoting: true,
  isExpanded: true,
  pollHeight: 0,
  pollRef: undefined,
  hasListReordered: false,
  showFinalResults: false,
  hasPollEnded: false,
  noVotesCaptured: false,
  tieFound: false,
  hasScrollbar: false
};

const localStorageInitialState = {
  ...initialPollProps,
  voters: {}
};

export const Provider = ({ children }) => {
  const forceResetPollPropsTimerRef = useRef();
  const stopPollTimerRef = useRef();
  const [composerRefState, setComposerRefState] = useState();
  const shouldAnimateListRef = useRef(false);
  const [selectedOption, setSelectedOption] = useState();
  const { channelData } = useChannel();
  const { username, channelArn = '', isViewerBanned } = channelData || {};
  const { userData, isSessionValid } = useUser();
  const channelId = extractChannelIdfromChannelArn(channelArn);
  const isModerator = channelId === userData?.trackingId;
  const { pathname } = useLocation();
  const isStreamManagerPage = pathname === '/manager';

  // Poll UI states
  const [pollState, dispatchPollState] = useReducer(
    (prevState, nextState) => ({ ...prevState, ...nextState }),
    initialPollState
  );
  // Active poll props
  const [pollProps, dispatchPollProps] = useReducer(
    (prevState, nextState) => ({ ...prevState, ...nextState }),
    initialPollProps
  );

  const pollHasEnded = useCallback(() => {
    dispatchPollState({ hasPollEnded: true });
  }, []);

  const {
    votes,
    question,
    isActive,
    duration,
    expiry,
    startTime,
    delay,
    pollCreatorId
  } = pollProps;
  const {
    isSubmitting,
    isVoting,
    isExpanded,
    pollHeight,
    pollRef,
    showFinalResults,
    hasListReordered,
    hasPollEnded,
    noVotesCaptured,
    tieFound,
    hasScrollbar
  } = pollState;

  const { value: savedPollData, set: savePollDataToLocalStorage } =
    useLocalStorage({
      key: username,
      initialValue: localStorageInitialState,
      options: {
        keyPrefix: 'poll',
        serialize: pack,
        deserialize: unpack
      }
    });

  const showFinalResultActionButton = () => ({
    duration: 10,
    expiry: new Date(Date.now() + 10 * 1000).toISOString()
  });

  const updatePollData = ({
    votes,
    duration,
    question,
    expiry,
    startTime,
    isActive,
    delay = 0,
    pollCreatorId
  }) => {
    const props = {
      ...(duration && { duration }),
      ...(question && { question }),
      ...(votes && { votes }),
      ...(expiry && { expiry }),
      ...(isActive && { isActive }),
      ...(startTime && { startTime }),
      ...(delay && { delay }),
      ...(pollCreatorId && { pollCreatorId })
    };

    dispatchPollProps(props);
  };

  const clearPollLocalStorage = useCallback(() => {
    savePollDataToLocalStorage(localStorageInitialState);
  }, [savePollDataToLocalStorage]);

  const resetPollProps = useCallback(() => {
    if (stopPollTimerRef.current) clearTimeout(stopPollTimerRef.current);
    clearPollLocalStorage();
    dispatchPollProps(initialPollProps);
    dispatchPollState(initialPollState);
    setSelectedOption();
    shouldAnimateListRef.current = false;
    stopPollTimerRef.current = undefined;
    forceResetPollPropsTimerRef.current = undefined;
  }, [clearPollLocalStorage]);

  const hasMounted = useRef(false);

  useEffect(() => {
    if (!channelData || hasMounted.current) return;

    if (isModerator && isStreamManagerPage && savedPollData?.isActive) {
      hasMounted.current = true;
      const {
        question,
        duration,
        startTime,
        votes: options,
        expiry,
        pollCreatorId
      } = savedPollData;

      updatePollData({
        pollCreatorId,
        expiry,
        startTime,
        question,
        duration,
        isActive: true,
        votes: options,
        delay
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelData, savedPollData]);

  useEffect(() => {
    let timeout;

    if (savedPollData?.hasPollEnded && !hasPollEnded) {
      pollHasEnded();
      return;
    }

    if (duration && !hasPollEnded && !savedPollData?.hasPollEnded) {
      const pollDuration = duration * 1000 - delay * 1000;

      timeout = setTimeout(() => {
        dispatchPollState({ hasPollEnded: true });
      }, pollDuration);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [
    delay,
    duration,
    hasPollEnded,
    pollHasEnded,
    savedPollData?.hasPollEnded
  ]);

  useEffect(() => {
    if (showFinalResults) {
      dispatchPollState({ hasListReordered: true });
    }
  }, [showFinalResults]);

  const checkForTie = (votes) => {
    const maxVote = Math.max(...votes.map((vote) => vote.count));
    const count = votes.filter((vote) => vote.count === maxVote).length;

    return count > 1;
  };

  useEffect(() => {
    if (hasPollEnded && !noVotesCaptured && !showFinalResults && !tieFound) {
      const noVotesCaptured = votes.every((vote) => vote.count === 0);
      const hasTie = checkForTie(votes);

      if (noVotesCaptured) {
        dispatchPollState({ noVotesCaptured: true });
      } else {
        if (hasTie) {
          dispatchPollState({ tieFound: true });
        } else {
          dispatchPollState({ showFinalResults: true });
        }
        const sortedVotes = votes.sort((a, b) =>
          a.count < b.count ? 1 : a.count > b.count ? -1 : 0
        );
        dispatchPollProps({
          votes: sortedVotes
        });
      }
    }
  }, [hasPollEnded, noVotesCaptured, showFinalResults, tieFound, votes]);

  // The value set here will determine the min height of the chat + poll container.
  // The reason its calculated this way is because the poll has a position: absolute
  const containerMinHeight = `${
    pollHeight + SPACE_BETWEEN_COMPOSER_AND_POLL + COMPOSER_HEIGHT
  }px`;

  useEffect(() => {
    if (pollRef) {
      dispatchPollState({ pollHeight: pollRef.offsetHeight });
    }
  }, [pollRef, isExpanded]);

  const getPollDetails = (votes) => {
    return votes.reduce(
      (acc, vote) => {
        if (!acc.highestCountOption) {
          acc.highestCountOption = vote;
        } else {
          if (vote.count > acc.highestCountOption.count) {
            acc.highestCountOption = vote;
          }
        }

        acc.totalVotes += vote.count;
        return acc;
      },
      { totalVotes: 0, highestCountOption: null }
    );
  };

  const { highestCountOption, totalVotes } = getPollDetails(votes);

  const saveVotesToLocalStorage = useCallback(
    (currentVotes, voter) => {
      savePollDataToLocalStorage({
        ...savedPollData,
        votes: currentVotes,
        voters: {
          ...savedPollData.voters,
          ...voter
        }
      });
    },
    [savePollDataToLocalStorage, savedPollData]
  );

  const updateSavedPollPropsOnTimerExpiry = useCallback(() => {
    const { duration, expiry } = showFinalResultActionButton();
    savePollDataToLocalStorage({
      ...savedPollData,
      duration,
      expiry,
      hasPollEnded: true
    });
  }, [savePollDataToLocalStorage, savedPollData]);

  const isAbleToVote =
    isVoting && !showFinalResults && !noVotesCaptured && !isViewerBanned;

  const shouldRenderRadioInput =
    isAbleToVote && isSessionValid && !isStreamManagerPage;

  const shouldRenderVoteButton = isAbleToVote && !!userData;

  const viewingOwnChannel =
    !isStreamManagerPage && userData?.trackingId?.toLowerCase() === channelId;

  const isCreatorOfActivePoll =
    isActive && pollCreatorId === userData?.trackingId?.toLowerCase();
  const shouldHideActivePoll = viewingOwnChannel && !isCreatorOfActivePoll;

  const shouldRenderProgressbar =
    !showFinalResults && !noVotesCaptured && !tieFound && startTime;

  const endPollAndResetPollProps = useCallback(() => {
    clearTimeout(forceResetPollPropsTimerRef.current);
    dispatchPollProps({ isActive: false });
    setTimeout(resetPollProps, 100);
    hasMounted.current = false;
  }, [resetPollProps]);

  useEffect(() => {
    if (hasPollEnded) {
      if (forceResetPollPropsTimerRef.current) {
        clearTimeout(forceResetPollPropsTimerRef.current);
      } else {
        forceResetPollPropsTimerRef.current = setTimeout(() => {
          if (isActive) endPollAndResetPollProps();
        }, NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS + EXTRA_TIME_TO_WAIT_FOR_END_POLL_EVENT);
      }
    }
  }, [endPollAndResetPollProps, isActive, hasPollEnded]);

  useEffect(() => {
    /*
    This code ensures that any expired poll is removed from the user interface (UI) when the user closes all instances of the UGC app and revist the app again.
    */
    const isPollExpired =
      startTime +
        duration * 1000 +
        NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS +
        EXTRA_TIME_TO_WAIT_FOR_END_POLL_EVENT <
      Date.now();

    if (isPollExpired && isActive) {
      endPollAndResetPollProps();
    }
  }, [duration, startTime, isActive, endPollAndResetPollProps]);

  const value = useMemo(
    () => ({
      isExpanded,
      pollHeight,
      containerMinHeight,
      showFinalResults,
      votes,
      highestCountOption,
      totalVotes,
      hasListReordered,
      shouldAnimateListRef,
      question,
      isActive,
      startTime,
      duration,
      selectedOption,
      setSelectedOption,
      isSubmitting,
      isVoting,
      updatePollData,
      expiry,
      resetPollProps,
      noVotesCaptured,
      tieFound,
      delay,
      clearPollLocalStorage,
      pollTabLabel: POLL_TAB_LABEL,
      showFinalResultActionButton,
      hasPollEnded,
      stopPollTimerRef,
      pollHasEnded,
      saveVotesToLocalStorage,
      savedPollData,
      savePollDataToLocalStorage,
      updateSavedPollPropsOnTimerExpiry,
      hasScrollbar,
      composerRefState,
      setComposerRefState,
      dispatchPollState,
      shouldRenderRadioInput,
      shouldRenderVoteButton,
      endPollAndResetPollProps,
      hasVotes: votes.length > 0,
      shouldRenderProgressbar,
      pollCreatorId,
      shouldHideActivePoll
    }),
    [
      pollCreatorId,
      isExpanded,
      pollHeight,
      containerMinHeight,
      showFinalResults,
      votes,
      highestCountOption,
      totalVotes,
      hasListReordered,
      question,
      isActive,
      startTime,
      duration,
      selectedOption,
      isSubmitting,
      isVoting,
      expiry,
      resetPollProps,
      noVotesCaptured,
      tieFound,
      delay,
      clearPollLocalStorage,
      hasPollEnded,
      pollHasEnded,
      saveVotesToLocalStorage,
      savedPollData,
      savePollDataToLocalStorage,
      updateSavedPollPropsOnTimerExpiry,
      hasScrollbar,
      composerRefState,
      shouldRenderRadioInput,
      shouldRenderVoteButton,
      endPollAndResetPollProps,
      shouldRenderProgressbar,
      shouldHideActivePoll
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired
};

export const usePoll = () => useContextHook(Context);
