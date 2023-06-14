import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';

import useContextHook from '../../contexts/useContextHook';
import { STREAM_ACTION_NAME } from '../../constants';

const COMPOSER_HEIGHT = 92;
const SPACE_BETWEEN_COMPOSER_AND_POLL = 100;

const Context = createContext(null);
Context.displayName = 'Poll';

export const pollInitialState = {
  votes: [],
  question: null,
  isActive: false,
  duration: 0,
  expiry: null,
  startTime: null
};

export const Provider = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pollHeight, setPollHeight] = useState(0);
  const [pollRef, setPollRef] = useState();
  const [hasListReordered, setHasListReordered] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(true);
  const [pollProps, dispatchPollProps] = useReducer(
    (prevState, nextState) => ({ ...prevState, ...nextState }),
    pollInitialState
  );
  const { votes, question, isActive, duration, expiry, startTime } = pollProps;

  const resetPollProps = useCallback(() => {
    dispatchPollProps(pollInitialState);
    setShowFinalResults(false);
    setHasListReordered(false);
    setIsSubmitting(false);
    setIsVoting(true);
    setPollHeight(0);
  }, []);

  const updatePollData = ({
    answers,
    duration,
    question,
    expiry,
    startTime,
    isActive
  }) => {
    const votes = answers.reduce((acc, answer) => {
      const option = { option: answer, count: 0 };
      acc.push(option);
      return acc;
    }, []);

    dispatchPollProps({
      duration,
      question,
      votes,
      expiry,
      isActive,
      startTime: new Date(startTime)
    });
  };

  const saveToLocalStorage = useCallback((pollDataToSave) => {
    localStorage.setItem(
      STREAM_ACTION_NAME.POLL,
      JSON.stringify(pollDataToSave)
    );
  }, []);

  const getPollDataFromLocalStorage = useCallback(() => {
    const pollData = localStorage.getItem(STREAM_ACTION_NAME.POLL);
    return JSON.parse(pollData);
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem(STREAM_ACTION_NAME.POLL);
  };

  useEffect(() => {
    const pollProps = getPollDataFromLocalStorage();
    if (pollProps) {
      const { question, duration, startTime, answers, expiry } = pollProps;
      updatePollData({
        expiry,
        startTime: new Date(startTime),
        question,
        duration,
        isActive: true,
        answers
      });
    }
  }, [getPollDataFromLocalStorage]);

  useEffect(() => {
    if (showFinalResults) {
      setHasListReordered(true);
    }
  }, [showFinalResults]);

  useEffect(() => {
    let timeout;
    if (duration) {
      timeout = setTimeout(() => {
        const sortedVotes = [...votes].sort((a, b) =>
          a.count > b.count ? -1 : a.count < b.count ? 1 : 0
        );
        dispatchPollProps({
          votes: sortedVotes,
          isPollActive: false
        });
        setShowFinalResults(true);
      }, duration * 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [duration, votes]);

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
      saveToLocalStorage,
      getPollDataFromLocalStorage,
      clearLocalStorage
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
      saveToLocalStorage,
      getPollDataFromLocalStorage
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired
};

export const usePoll = () => useContextHook(Context);
