import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useStreamManagerActions } from '../../../../../contexts/StreamManagerActions';
import { streamManager as $streamManagerContent } from '../../../../../content';
import {
  QUIZ_DATA_KEYS,
  POLL_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../../../../constants';
import Input from './formElements/Input';
import RadioTextGroup from './formElements/RadioTextGroup/RadioTextGroup';
import RangeSelector from './formElements/RangeSelector';

const $content = $streamManagerContent.stream_manager_actions.quiz;

const QuizOrPollQuestionsComponent = ({ formType }) => {
  const {
    currentStreamManagerActionErrors,
    getStreamManagerActionData,
    updateStreamManagerActionData
  } = useStreamManagerActions();
  const {
    question,
    answers,
    correctAnswerIndex = undefined,
    duration
  } = getStreamManagerActionData(formType);

  const LIMITS = useMemo(
    () => STREAM_MANAGER_ACTION_LIMITS[formType],
    [formType]
  );
  const contentMapper = useMemo(
    () => ({
      [STREAM_ACTION_NAME.QUIZ]: {
        content: $streamManagerContent.stream_manager_actions.quiz,
        dataKey: QUIZ_DATA_KEYS.QUESTION,
        rangeSelector: {
          label: $streamManagerContent.stream_manager_actions.quiz.duration,
          dataKey: QUIZ_DATA_KEYS.DURATION,
          min: LIMITS[QUIZ_DATA_KEYS.DURATION].min,
          max: LIMITS[QUIZ_DATA_KEYS.DURATION].max
        },
        inputGroup: {
          label: $streamManagerContent.stream_manager_actions.quiz.answers,
          type: 'radio',
          dataKey: QUIZ_DATA_KEYS.ANSWERS,
          min: LIMITS[QUIZ_DATA_KEYS.ANSWERS].min,
          max: LIMITS[QUIZ_DATA_KEYS.ANSWERS].max
        }
      },
      [STREAM_ACTION_NAME.POLL]: {
        content: $streamManagerContent.stream_manager_actions.poll,
        dataKey: POLL_DATA_KEYS.QUESTION,
        rangeSelector: {
          label: $streamManagerContent.stream_manager_actions.poll.duration,
          dataKey: POLL_DATA_KEYS.DURATION,
          min: LIMITS[POLL_DATA_KEYS.DURATION].min,
          max: LIMITS[POLL_DATA_KEYS.DURATION].max
        },
        inputGroup: {
          label: $streamManagerContent.stream_manager_actions.poll.answers,
          type: 'text',
          dataKey: POLL_DATA_KEYS.ANSWERS,
          min: LIMITS[POLL_DATA_KEYS.ANSWERS].min,
          max: LIMITS[POLL_DATA_KEYS.ANSWERS].max
        }
      }
    }),
    [LIMITS]
  );

  const updateStreamManagerActionQuizPollData = (data) => {
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: formType
    });
  };

  const radioGroupSelectedAnswerProps =
    formType === STREAM_ACTION_NAME.QUIZ
      ? {
          selectedDataKey: QUIZ_DATA_KEYS.CORRECT_ANSWER_INDEX,
          selectedOptionIndex: correctAnswerIndex
        }
      : {};

  const {
    content: {
      question: questionLabel,
      answers_input_name_attribute: streamManagerActionFormAnswers,
      question_input_name_attribute: streamManagerActionFormQuestion,
      duration_input_name_attribute: streamManagerActionFormDuration
    },
    dataKey,
    rangeSelector: {
      label: rangeSelectorLabel,
      dataKey: rangeSelectorDataKey,
      min: rangeSelectorMin,
      max: rangeSelectorMax
    },
    inputGroup: {
      type: inputGroupInputType,
      dataKey: inputGroupDataKey,
      min: inputGroupMin,
      max: inputGroupMax
    }
  } = contentMapper[formType];

  return (
    <>
      <Input
        label={questionLabel}
        name={streamManagerActionFormQuestion}
        dataKey={dataKey}
        value={question}
        onChange={updateStreamManagerActionQuizPollData}
        placeholder={contentMapper[formType].content.question}
        error={currentStreamManagerActionErrors[dataKey]}
      />
      <RadioTextGroup
        inputType={inputGroupInputType}
        addOptionButtonText={$content.add_answer}
        dataKey={inputGroupDataKey}
        optionErrors={currentStreamManagerActionErrors[QUIZ_DATA_KEYS.ANSWERS]}
        label={contentMapper[formType].content.answers}
        minOptions={inputGroupMin}
        maxOptions={inputGroupMax}
        name={streamManagerActionFormAnswers}
        options={answers}
        placeholder={$content.answer}
        updateData={updateStreamManagerActionQuizPollData}
        formType={formType}
        {...radioGroupSelectedAnswerProps}
      />
      <RangeSelector
        label={rangeSelectorLabel}
        name={streamManagerActionFormDuration}
        dataKey={rangeSelectorDataKey}
        updateData={updateStreamManagerActionQuizPollData}
        value={duration}
        min={rangeSelectorMin}
        max={rangeSelectorMax}
      />
    </>
  );
};

QuizOrPollQuestionsComponent.propTypes = {
  formType: PropTypes.string.isRequired
};

export default QuizOrPollQuestionsComponent;
