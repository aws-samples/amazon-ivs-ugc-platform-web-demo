import { m } from 'framer-motion';
import { useState, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  correctAnswerClasses,
  incorrectAnswerClasses,
  defaultSlideUpVariant,
  defaultViewerStreamActionTransition
} from './viewerStreamActionsTheme';
import { clsm, isTextColorInverted } from '../../../utils';
import { PROFILE_COLORS } from '../../../constants';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import Button from '../../../components/Button';
import FloatingNav from '../../../components/FloatingNav';
import ProgressBar from './ProgressBar';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';

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
  const { isMobileView } = useResponsiveDevice();
  const shouldInvertColors = isTextColorInverted(color);

  const profileColorButtonClassNames = clsm([
    'disabled:text-black',
    'focus:shadow-black',
    'text-black',
    `bg-profile-${color}-light`,
    `focus:bg-profile-${color}-light`,
    `hover:bg-profile-${color}-light-hover`,
    shouldInvertColors && [
      'disabled:text-white',
      'focus:shadow-white',
      'text-white'
    ]
  ]);

  const selectAnswer = (index) => {
    setIsAnswerSelected(true);
    setChosenAnswerIndex(index);
    setTimeout(() => setCurrentViewerAction(null), 2000);
  };

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
        !shouldRenderActionInTab && [
          'max-w-[640px]',
          'min-w-[482px]',
          'h-screen',
          'justify-end'
        ],
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
        'mb-4',
        isControlsOpen && !shouldRenderActionInTab && 'mb-40',
        isMobileView && 'pb-20'
      ])}
    >
      <m.div
        {...createAnimationProps({
          animations: ['fadeIn-full'],
          customVariants: defaultSlideUpVariant,
          transition: defaultViewerStreamActionTransition,
          options: { shouldAnimate: !shouldRenderActionInTab }
        })}
        className={clsm([
          `bg-profile-${color}`,
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
            'text-black',
            shouldInvertColors && 'text-white'
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
            />
          </div>
        </div>
      </m.div>
      {isMobileView && <FloatingNav />}
    </div>
  );
};

QuizCard.defaultProps = {
  answers: [],
  color: 'default',
  correctAnswerIndex: 0,
  duration: 10,
  isControlsOpen: false,
  shouldRenderActionInTab: false
};

QuizCard.propTypes = {
  answers: PropTypes.arrayOf(PropTypes.string),
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  correctAnswerIndex: PropTypes.number,
  duration: PropTypes.number,
  isControlsOpen: PropTypes.bool,
  question: PropTypes.string.isRequired,
  setCurrentViewerAction: PropTypes.func.isRequired,
  shouldRenderActionInTab: PropTypes.bool,
  startTime: PropTypes.number.isRequired
};

export default QuizCard;
