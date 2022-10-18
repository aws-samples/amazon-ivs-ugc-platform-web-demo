import { m } from 'framer-motion';
import { useCallback, useState, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  correctAnswerClasses,
  defaultViewerStreamActionAnimationProps,
  incorrectAnswerClasses,
  defaultViewerStreamActionVariants
} from './viewerStreamActionsTheme';
import { clsm } from '../../../utils';
import { STREAM_ACTION_NAME } from '../../../constants';
import Button from '../../../components/Button';
import ProgressBar from './ProgressBar';

const defaultQuizAnswerHeight = 42;

const QuizCard = ({
  answers,
  color,
  correctAnswerIndex,
  duration,
  question,
  startTime,
  isControlsOpen,
  setCurrentViewerAction,
  shouldRenderActionInTab
}) => {
  const [answerHeight, setAnswerHeight] = useState(defaultQuizAnswerHeight);
  const [isAnswerSelected, setIsAnswerSelected] = useState();
  const [chosenAnswerIndex, setChosenAnswerIndex] = useState();
  const quizButtonArrRef = useRef([]);

  const profileColorButtonClassNames = clsm([
    color
      ? [
          `bg-profile-${color}-light`,
          `hover:bg-profile-${color}-light-hover`,
          `focus:bg-profile-${color}-light`
        ]
      : [
          'bg-profile-default-light',
          'hover:bg-profile-default-light-hover',
          'focus:bg-profile-default-light'
        ],
    color && ['green', 'blue'].includes(color)
      ? ['focus:shadow-white', 'text-white', 'disabled:text-white']
      : ['focus:shadow-black', 'text-black', 'disabled:text-black']
  ]);

  const quizContainerClasses = !shouldRenderActionInTab
    ? ['max-w-[640px]', 'min-w-[482px]', 'h-screen', 'justify-end']
    : '';

  const selectAnswer = (index) => {
    setIsAnswerSelected(true);
    setChosenAnswerIndex(index);
    setTimeout(() => setCurrentViewerAction(null), 2000);
  };

  const onCompletionHandler = useCallback(() => {
    setCurrentViewerAction((prev) => {
      if (prev?.name === STREAM_ACTION_NAME.QUIZ) return null;

      // Don't cancel the current action if it changed to something other than a quiz
      return prev;
    });
  }, [setCurrentViewerAction]);

  useLayoutEffect(() => {
    quizButtonArrRef.current.forEach((quizButton) => {
      if (quizButton.clientHeight > answerHeight) {
        setAnswerHeight(quizButton.clientHeight);
      }
    });
  }, [answerHeight]);

  return (
    <div
      className={clsm([
        quizContainerClasses,
        'absolute',
        'flex-col',
        'flex',
        'h-full',
        'no-scrollbar',
        'overflow-x-hidden',
        'overflow-y-auto',
        'p-5',
        'supports-overlay:overflow-y-overlay',
        'transition-[margin]',
        'w-full',
        'z-10',
        'mb-4',
        isControlsOpen && !shouldRenderActionInTab && 'mb-40'
      ])}
    >
      <m.div
        {...(!shouldRenderActionInTab
          ? defaultViewerStreamActionAnimationProps
          : {})}
        variants={defaultViewerStreamActionVariants}
        className={clsm([
          `bg-profile-${color ? color : 'default'}`,
          'flex-col',
          'flex',
          'items-start',
          'rounded-3xl',
          'w-full'
        ])}
      >
        <h3
          className={clsm([
            'flex',
            'p-5',
            'w-full',
            'justify-center',
            'break-word',
            `${
              color && ['green', 'blue'].includes(color)
                ? 'text-white'
                : 'text-black'
            }`
          ])}
        >
          {question}
        </h3>
        <div
          className={clsm([
            'flex-col',
            'flex',
            'px-5',
            'space-y-2.5',
            'w-full'
          ])}
        >
          {answers.map((answer, index) => (
            <Button
              key={`answer-${index}`}
              ariaLabel={`answer ${index + 1}`}
              customStyles={{
                minHeight: `${answerHeight}px`
              }}
              className={clsm([
                profileColorButtonClassNames,
                'whitespace-normal',
                'h-auto',
                'break-anywhere',
                isAnswerSelected === true && chosenAnswerIndex === index
                  ? index === correctAnswerIndex
                    ? correctAnswerClasses
                    : incorrectAnswerClasses
                  : ''
              ])}
              onClick={() => selectAnswer(index)}
              isDisabled={
                isAnswerSelected === true && chosenAnswerIndex !== index
              }
              ref={(el) => (quizButtonArrRef.current[index] = el)}
            >
              {answer}
            </Button>
          ))}
          <div className={clsm(['pt-2.5', 'pb-5'])}>
            <ProgressBar
              color={color}
              duration={duration}
              startTime={startTime}
              onCompletion={onCompletionHandler}
            />
          </div>
        </div>
      </m.div>
    </div>
  );
};

QuizCard.defaultProps = {
  answers: [],
  color: '',
  correctAnswerIndex: 0,
  duration: 10,
  isControlsOpen: false,
  shouldRenderActionInTab: false
};

QuizCard.propTypes = {
  answers: PropTypes.arrayOf(PropTypes.string),
  color: PropTypes.string,
  correctAnswerIndex: PropTypes.number,
  duration: PropTypes.number,
  isControlsOpen: PropTypes.bool,
  question: PropTypes.string.isRequired,
  setCurrentViewerAction: PropTypes.func.isRequired,
  shouldRenderActionInTab: PropTypes.bool,
  startTime: PropTypes.number.isRequired
};

export default QuizCard;
