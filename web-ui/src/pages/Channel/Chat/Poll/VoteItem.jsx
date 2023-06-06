import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { CheckCircle } from '../../../../assets/icons';
import { clsm, convertConcurrentViews, noop } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import Tooltip from '../../../../components/Tooltip/Tooltip';
import { useLocation } from 'react-router-dom';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';

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

const VoteItem = ({
  count,
  isHighestCount,
  option,
  percentage,
  showFinalResults,
  showVotePercentage,
  selectedOption,
  color,
  textColor,
  onChange,
  isVoting,
  inputAndLabelId,
  inputDivControls,
  radioBoxControls
}) => {
  const hasWon = isHighestCount && showFinalResults;
  const countFormatted = convertConcurrentViews(count);
  const { pathname } = useLocation();
  const { hasListReordered } = usePoll();
  const isStreamManagerPage = pathname === '/manager';

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
      if (item.offsetHeight > 24 && item.offsetHeight < 40) {
        shouldResizeAllContainers = true;
        break;
      }
    }

    parentDivs.forEach((item) => {
      if (hasWon) return;
      item.classList.add(shouldResizeAllContainers ? 'h-14' : 'h-11');
    });
  }, [option, color, hasWon]);

  return (
    <motion.div
      layout={!hasListReordered}
      transition={{ stiffness: 150, damping: 60, duration: 0.3 }}
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
      {(!isVoting || showFinalResults) && (
        <div
          style={{ width: `${percentage}%` }}
          className={clsm([
            'absolute',
            'left-[-1px]',
            'h-full',
            `bg-poll-${color}-pollButtonBg`,
            hasWon && ['bg-white', 'h-20'],
            percentage < 15 ? 'rounded-[100%]' : 'rounded-[100px]'
          ])}
        />
      )}
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
          'pr-4'
        ])}
      >
        <div
          className={clsm([
            'px-4',
            'flex',
            'flex-row',
            'items-center',
            'h-full',
            'w-auto',
            'max-w-[82%]'
          ])}
        >
          <div
            className={clsm([
              'flex',
              'justify-center',
              'flex-col',
              'h-full',
              'w-full'
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
            <div className={clsm(['flex', 'items-center', 'justify-between'])}>
              <div
                className={clsm([
                  '[&>input.radio]:top-[-1px]',
                  'flex',
                  'relative',
                  'items-center'
                ])}
              >
                {!isStreamManagerPage && !showFinalResults && (
                  <motion.input
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
                      onChange(option);
                    }}
                    type="radio"
                    value={selectedOption}
                  />
                )}
              </div>
              <motion.label
                animate={inputDivControls}
                htmlFor={inputAndLabelId}
                className={clsm([
                  isStreamManagerPage && 'max-w-[385px]',
                  'pb-[3px]',
                  'w-full',
                  'line-clamp-2',
                  'text-p4',
                  'font-semibold',
                  `text-${textColor}`,
                  !isStreamManagerPage && !showFinalResults && `translate-x-7`,
                  hasWon && [
                    'text-h3',
                    `text-poll-${color}-pollWinnerTextColor`,
                    'font-bold'
                  ]
                ])}
              >
                {option}
              </motion.label>
            </div>
          </div>
          <motion.div
            className={clsm(['w-5', 'h-5', 'pb-[20px]'])}
            {...opacityAnimation}
          >
            {selectedOption === option && !isVoting && (
              <CheckCircle
                className={clsm(['w-5', 'h-5', 'ml-2.5', `fill-${textColor}`])}
              />
            )}
          </motion.div>
        </div>
        {(!isVoting || showFinalResults) && (
          <div
            className={clsm([
              'h-auto',
              'cursor-default',
              'flex',
              'justify-between',
              'items-center',
              'w-auto'
            ])}
          >
            {showVotePercentage ? (
              <Tooltip
                position="below"
                message={`${count.toLocaleString()} ${$content.votes}`}
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
              >{`${percentage}% (${countFormatted} ${$content.votes})`}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

VoteItem.defaultProps = {
  count: 0,
  isHighestCount: false,
  showFinalResults: false,
  showVotePercentage: false,
  percentage: 0,
  selectedOption: undefined,
  radioBoxControls: {},
  inputDivControls: {},
  inputAndLabelId: undefined,
  isVoting: undefined,
  onChange: noop
};

VoteItem.propTypes = {
  count: PropTypes.number,
  color: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
  isHighestCount: PropTypes.bool,
  option: PropTypes.string.isRequired,
  selectedOption: PropTypes.string,
  percentage: PropTypes.number,
  showFinalResults: PropTypes.bool,
  showVotePercentage: PropTypes.bool,
  onChange: PropTypes.func,
  isVoting: PropTypes.bool,
  inputAndLabelId: PropTypes.string,
  inputDivControls: PropTypes.object,
  radioBoxControls: PropTypes.object
};

export default VoteItem;
