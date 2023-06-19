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
import { STREAM_ACTION_NAME } from '../../constants';
import { useUser } from '../User';

const COMPOSER_HEIGHT = 92;
const SPACE_BETWEEN_COMPOSER_AND_POLL = 100;

const Context = createContext(null);
Context.displayName = 'Poll';

const POLL_TAB_LABEL = 'Live poll';

export const pollInitialState = {
  votes: [],
  question: null,
  isActive: false,
  duration: 0,
  expiry: null,
  startTime: null,
  delay: 0
};

export const Provider = ({ children }) => {
  const stopPollTimerRef = useRef();
  const [noVotesCaptured, setNoVotesCaptured] = useState(false);
  const [tieFound, setTieFound] = useState(false);
  const [selectedOption, setSelectedOption] = useState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pollHeight, setPollHeight] = useState(0);
  const [pollRef, setPollRef] = useState();
  const [hasListReordered, setHasListReordered] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(true);
  const [hasPollEnded, setHasPollEnded] = useState(false);
  const [pollProps, dispatchPollProps] = useReducer(
    (prevState, nextState) => ({ ...prevState, ...nextState }),
    pollInitialState
  );
  const { userData } = useUser();

  const pollHasEnded = useCallback(() => {
    setHasPollEnded(true);
  }, []);

  const { votes, question, isActive, duration, expiry, startTime, delay } =
    pollProps;

  const resetPollProps = useCallback(() => {
    dispatchPollProps(pollInitialState);
    setShowFinalResults(false);
    setHasListReordered(false);
    setIsSubmitting(false);
    setIsVoting(true);
    setPollHeight(0);
    setTieFound(false);
    setNoVotesCaptured(false);
    setHasListReordered(false);
    setHasPollEnded(false);
    setSelectedOption();
  }, []);

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
    delay = 0
  }) => {
    const props = {
      ...(duration && { duration }),
      ...(question && { question }),
      ...(votes && { votes }),
      ...(expiry && { expiry }),
      ...(isActive && { isActive }),
      ...(startTime && { startTime }),
      ...(delay && { delay })
    };

    dispatchPollProps(props);
  };

  const getPollDataFromLocalStorage = useCallback(() => {
    const pollData = localStorage.getItem(STREAM_ACTION_NAME.POLL);
    return JSON.parse(pollData);
  }, []);

  const saveToLocalStorage = useCallback(
    (pollDataToSave) => {
      const pollData = getPollDataFromLocalStorage();
      localStorage.setItem(
        STREAM_ACTION_NAME.POLL,
        JSON.stringify({
          ...(pollData || {}),
          ...pollDataToSave
        })
      );
    },
    [getPollDataFromLocalStorage]
  );

  const clearLocalStorage = () => {
    localStorage.removeItem(STREAM_ACTION_NAME.POLL);
  };

  useEffect(() => {
    const savedPollProps = getPollDataFromLocalStorage();

    if (savedPollProps) {
      const {
        question,
        duration,
        startTime,
        votes: options,
        expiry
      } = savedPollProps;

      updatePollData({
        expiry,
        startTime,
        question,
        duration,
        isActive: true,
        votes: options,
        delay
      });
    }
  }, [userData, getPollDataFromLocalStorage, delay]);

  useEffect(() => {
    let timeout;
    const pollData = getPollDataFromLocalStorage();

    if (pollData?.hasPollEnded && !hasPollEnded) {
      pollHasEnded();
      return;
    }

    if (duration && !hasPollEnded && !pollData?.hasPollEnded) {
      const pollDuration = duration * 1000 - delay * 1000;

      timeout = setTimeout(() => {
        setHasPollEnded(true);
      }, pollDuration);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [
    delay,
    duration,
    getPollDataFromLocalStorage,
    hasPollEnded,
    pollHasEnded
  ]);

  useEffect(() => {
    if (showFinalResults) {
      setHasListReordered(true);
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
        setNoVotesCaptured(true);
      } else {
        if (hasTie) {
          setTieFound(true);
        } else {
          setShowFinalResults(true);
        }
        const sortedVotes = votes.sort((a, b) =>
          a.count < b.count ? 1 : a.count > b.count ? -1 : 0
        );
        dispatchPollProps({
          votes: sortedVotes,
          isPollActive: false
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
      setPollHeight(pollRef.offsetHeight);
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

  const value = useMemo(
    () => ({
      isExpanded,
      setIsExpanded,
      pollHeight,
      setPollHeight,
      setPollRef,
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
      setSelectedOption,
      isSubmitting,
      setIsSubmitting,
      isVoting,
      setIsVoting,
      updatePollData,
      expiry,
      resetPollProps,
      noVotesCaptured,
      tieFound,
      delay,
      saveToLocalStorage,
      getPollDataFromLocalStorage,
      clearLocalStorage,
      pollTabLabel: POLL_TAB_LABEL,
      showFinalResultActionButton,
      hasPollEnded,
      stopPollTimerRef,
      pollHasEnded
    }),
    [
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
      saveToLocalStorage,
      getPollDataFromLocalStorage,
      hasPollEnded,
      stopPollTimerRef,
      pollHasEnded
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired
};

export const usePoll = () => useContextHook(Context);
