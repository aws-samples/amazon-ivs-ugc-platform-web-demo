import { useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { CheckCircle } from '../../../../assets/icons';
import { clsm, convertConcurrentViews } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import Tooltip from '../../../../components/Tooltip/Tooltip';
import { useLocation } from 'react-router-dom';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const opacityAnimation = createAnimationProps({
  customVariants: {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1
    }
  },
  transition: { duration: 0.3 }
});

const VoteItem = forwardRef(
  (
    {
      count,
      isHighestCount,
      option,
      percentage,
      showVotePercentage,
      color,
      textColor,
      inputAndLabelId,
      radioBoxControls
    },
    ref
  ) => {
    const {
      selectedOption,
      setSelectedOption,
      isVoting,
      showFinalResults,
      noVotesCaptured,
      shouldRenderRadioInput
    } = usePoll();
    const hasWon = isHighestCount && showFinalResults;
    const countFormatted = convertConcurrentViews(count);
    const { pathname } = useLocation();
    const { isSessionValid } = useUser();

    const voteContent =
      count === 1 ? $content.vote.toLowerCase() : $content.votes;
    const isStreamManagerPage = pathname === '/manager';
    const isPollPercentageVisible =
      !isSessionValid || !isVoting || showFinalResults || isStreamManagerPage;

    const showCurrentVotes = isPollPercentageVisible || noVotesCaptured;

    useEffect(() => {
      /**
       * This code dynamically adjusts the height of certain containers based on the height
       * of their child elements, specifically '.vote-option-container' and
       * '.vote-option-parent-container'. If any '.vote-option-container'
       * has a height between 24 and 44 pixels, it sets shouldResizeAllContainers to true,
       * and the parent containers are given a height of either 58 pixels or 44 pixels
       * based on the value of shouldResizeAllContainers.
       */
      let shouldResizeAllContainers = false;
      const listItems = document.querySelectorAll('.vote-option-container');
      const parentDivs = document.querySelectorAll(
        '.vote-option-parent-container'
      );

      for (const item of listItems) {
        if (item.offsetHeight > 24 && item.offsetHeight < 50) {
          shouldResizeAllContainers = true;
          break;
        }
      }

      parentDivs.forEach((item) => {
        if (hasWon) return;
        item.classList.add(shouldResizeAllContainers ? '!h-14' : '!h-11');
      });
    }, [option, color, hasWon]);

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        ref={ref}
        onClick={() => {
          if (!isVoting) return;
          setSelectedOption(option);
        }}
        className={clsm([
          'overflow-hidden',
          'vote-option-parent-container',
          'relative',
          'w-full',
          `bg-poll-${color}-pollVoteBg`,
          'rounded-[100px]',
          'h-full',
          hasWon && [
            'h-20',
            `bg-poll-${color}-pollVoteBg`,
            'border-2',
            'border-white',
            'mb-1.5'
          ]
        ])}
      >
        <motion.div
          key="pollPercentageContainer"
          {...createAnimationProps({
            customVariants: {
              hidden: {
                width: 0
              },
              visible: {
                width: `${percentage === 100 ? percentage + 10 : percentage}%`
              }
            },
            transition: { duration: 0.15 },
            options: {
              isVisible: isPollPercentageVisible
            }
          })}
          className={clsm([
            'h-full',
            `bg-poll-${color}-pollButtonBg`,
            hasWon && ['bg-white', 'h-20'],
            percentage < 15 ? 'rounded-r-[100%]' : 'rounded-r-[100px]',
            hasWon && 'mt-[-2px]'
          ])}
        />
        <div
          className={clsm([
            'translate-y-[-50%]',
            'top-[50%]',
            'absolute',
            'w-full',
            'left-0',
            'rounded-[100px]',
            'vote-option-container',
            'flex',
            'items-center',
            'justify-between',
            'pr-2.5'
          ])}
        >
          <div
            className={clsm([
              'pl-4',
              'flex',
              'flex-row',
              'items-center',
              'h-full',
              hasWon &&
                isStreamManagerPage && [
                  'lg:max-w-[75%]',
                  'max-w-[65%]',
                  'md:max-w-[55%]',
                  'sm:max-w-[80%]'
                ],
              hasWon &&
                !isStreamManagerPage && [
                  'lg:max-w-[85%]',
                  'max-w-[65%]',
                  'md:max-w-[58%]',
                  'sm:max-w-[63%]',
                  'xs:max-w-[50%]'
                ],
              !hasWon && ['max-w-[75%]', 'xs:max-w-[65%]']
            ])}
          >
            <div
              className={clsm([
                'flex',
                'justify-center',
                'flex-col',
                'h-full',
                'w-full',
                'pr-1'
              ])}
            >
              {hasWon && (
                <p
                  className={clsm([
                    'text-p3',
                    `text-poll-${color}-pollWinnerTextColor`
                  ])}
                >
                  {$content.winner}
                </p>
              )}
              <div className={clsm(['flex', 'items-center', 'justify-start'])}>
                <div
                  className={clsm([
                    '[&>input.radio]:top-[0px]',
                    'flex',
                    'relative',
                    'items-center'
                  ])}
                >
                  {shouldRenderRadioInput && (
                    <motion.input
                      style={{
                        width: '300px',
                        height: '58px',
                        top: '-30px',
                        left: '-20px'
                      }}
                      animate={radioBoxControls}
                      id={inputAndLabelId}
                      aria-label={option}
                      checked={selectedOption === option}
                      className={clsm([
                        'radio',
                        `with-${color}-bg`,
                        `with-${color}-border`,
                        `with-${color}-checked-hover`,
                        `with-${color}-focus`,
                        `with-${color}-hover`
                      ])}
                      data-testid={`${option}-radio-button`}
                      name={option}
                      onChange={() => {
                        setSelectedOption(option);
                      }}
                      type="radio"
                      value={selectedOption}
                    />
                  )}
                </div>
                <label
                  htmlFor={inputAndLabelId}
                  className={clsm([
                    'w-max',
                    'break-words',
                    'line-clamp-2',
                    'text-p4',
                    'font-semibold',
                    `text-${textColor}`,
                    hasWon && [
                      'text-h3',
                      `text-poll-${color}-pollWinnerTextColor`,
                      'font-bold'
                    ],
                    isVoting ? 'cursor-pointer' : 'cursor-default',
                    shouldRenderRadioInput
                      ? `translate-x-7`
                      : ['translate-x-0', 'cursor-default']
                  ])}
                >
                  {option}
                </label>
              </div>
            </div>
            <motion.div
              className={clsm(['w-5', 'h-5', 'pb-[20px]'])}
              {...opacityAnimation}
            >
              {isSessionValid && selectedOption === option && !isVoting && (
                <CheckCircle
                  className={clsm([
                    'w-5',
                    'h-5',
                    `fill-poll-${color}-pollWinnerTextColor`
                  ])}
                />
              )}
            </motion.div>
          </div>
          {showCurrentVotes && (
            <div
              className={clsm([
                'h-auto',
                'cursor-default',
                'flex',
                'justify-between',
                'items-center',
                'w-auto',
                'pr-3'
              ])}
            >
              {showVotePercentage ? (
                <Tooltip
                  position="below"
                  message={`${count.toLocaleString()} ${voteContent}`}
                  translate={{ y: -6 }}
                >
                  <motion.p
                    {...opacityAnimation}
                    className={clsm([
                      'text-p2',
                      `text-poll-${color}-pollWinnerTextColor`,
                      hasWon && ['text-h3']
                    ])}
                  >{`${percentage}%`}</motion.p>
                </Tooltip>
              ) : (
                <p
                  className={clsm([
                    'ml-4',
                    'whitespace-nowrap',
                    `text-poll-${color}-pollWinnerTextColor`,
                    'text-p2',
                    hasWon && ['text-h3']
                  ])}
                >{`${percentage}% (${countFormatted} ${voteContent})`}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

VoteItem.defaultProps = {
  count: 0,
  isHighestCount: false,
  showVotePercentage: false,
  percentage: 0,
  radioBoxControls: {},
  inputAndLabelId: undefined,
  noVotesCaptured: false
};

VoteItem.propTypes = {
  count: PropTypes.number,
  color: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
  isHighestCount: PropTypes.bool,
  option: PropTypes.string.isRequired,
  percentage: PropTypes.number,
  showVotePercentage: PropTypes.bool,
  inputAndLabelId: PropTypes.string,
  radioBoxControls: PropTypes.object,
  noVotesCaptured: PropTypes.bool
};

export default VoteItem;
