import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import { streamManager as $streamManagerContent } from '../../../../content';
import {
  QUIZ_STREAM_ACTION_DURATION_MAX,
  QUIZ_STREAM_ACTION_DURATION_MIN,
  STREAM_ACTION_NAME
} from '../../../../constants';
import Input from './formElements/Input';
import RadioGroup from './formElements/RadioGroup';
import RangeSelector from './formElements/RangeSelector';

const $content = $streamManagerContent.stream_manager_actions.quiz;

export const QUIZ_DATA_KEYS = {
  QUESTION: 'question',
  ANSWERS: 'answers',
  CORRECT_ANSWER_INDEX: 'correctAnswerIndex',
  DURATION: 'duration'
};

const Quiz = () => {
  const { getStreamManagerActionData, updateStreamManagerActionData } =
    useStreamManagerActions();
  const { question, answers, correctAnswerIndex, duration } =
    getStreamManagerActionData(STREAM_ACTION_NAME.QUIZ);

  const updateStreamManagerActionQuizData = (data) =>
    updateStreamManagerActionData(data, STREAM_ACTION_NAME.QUIZ);

  return (
    <>
      <Input
        label={$content.question}
        name="streamManagerActionFormQuestion"
        dataKey={QUIZ_DATA_KEYS.QUESTION}
        value={question}
        onChange={updateStreamManagerActionQuizData}
        placeholder={$content.question}
      />
      <RadioGroup
        label={$content.answers}
        name="streamManagerActionFormAnswers"
        addOptionButtonText={$content.add_answer}
        options={answers}
        selectedOptionIndex={correctAnswerIndex}
        updateData={updateStreamManagerActionQuizData}
        dataKey={QUIZ_DATA_KEYS.ANSWERS}
        selectedDataKey={QUIZ_DATA_KEYS.CORRECT_ANSWER_INDEX}
        placeholder={$content.answer}
      />
      <RangeSelector
        label={$content.duration}
        name="streamManagerActionFormDuration"
        dataKey={QUIZ_DATA_KEYS.DURATION}
        updateData={updateStreamManagerActionQuizData}
        value={duration}
        min={QUIZ_STREAM_ACTION_DURATION_MIN}
        max={QUIZ_STREAM_ACTION_DURATION_MAX}
      />
    </>
  );
};

export default Quiz;
