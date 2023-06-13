import PropTypes from 'prop-types';
import { createContext, useEffect, useMemo, useState } from 'react';

import useContextHook from '../../contexts/useContextHook';

const COMPOSER_HEIGHT = 92;
const SPACE_BETWEEN_COMPOSER_AND_POLL = 100;

const Context = createContext(null);
Context.displayName = 'Poll';

const startTime = Date.now();

export const Provider = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pollHeight, setPollHeight] = useState(0);
  const [pollRef, setPollRef] = useState();
  const [hasListReordered, setHasListReordered] = useState(false);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(true);
  const [votes, setVotes] = useState([
    { id: 1, option: 'Fried chicken and pasta with salad', count: 22109 },
    {
      id: 2,
      option: 'Fried chicken',
      count: 233333
    },
    {
      id: 3,
      option: 'Sushi',
      count: 24300
    },
    { id: 4, option: 'Hotdogs', count: 93300 },
    { id: 5, option: 'Beef', count: 32200 }
  ]);
  const duration = 8;
  const question = 'What food should I order tonight?';
  const isActive = true;

  useEffect(() => {
    if (showFinalResults) {
      setHasListReordered(true);
    }
  }, [showFinalResults]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVotes([
        {
          id: 2,
          option: 'Fried chicken a pasta with extra spicy',
          count: 233333
        },
        { id: 4, option: 'Hotdogs', count: 93300 },
        { id: 5, option: 'Beef', count: 32200 },
        { id: 3, option: 'Sushi', count: 24300 },
        { id: 1, option: 'Fried chicken and pasta', count: 22109 }
      ]);
      setShowFinalResults(true);
    }, duration * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

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
      setIsVoting
    }),
    [
      containerMinHeight,
      hasListReordered,
      highestCountOption,
      isActive,
      isExpanded,
      isSubmitting,
      isVoting,
      pollHeight,
      selectedOption,
      showFinalResults,
      totalVotes,
      votes
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired
};

export const usePoll = () => useContextHook(Context);
