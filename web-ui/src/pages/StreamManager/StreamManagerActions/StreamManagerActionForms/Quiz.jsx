import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import { streamManager as $streamManagerContent } from '../../../../content';
import {
  QUIZ_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../../../constants';
import Input from './formElements/Input';
import RadioGroup from './formElements/RadioGroup';
import RangeSelector from './formElements/RangeSelector';

const $content = $streamManagerContent.stream_manager_actions.quiz;
const LIMITS = STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.QUIZ];

const Quiz = () => {
  const {
    currentStreamManagerActionErrors,
    getStreamManagerActionData,
    updateStreamManagerActionData
  } = useStreamManagerActions();
  const { question, answers, correctAnswerIndex, duration } =
    getStreamManagerActionData(STREAM_ACTION_NAME.QUIZ);

  const updateStreamManagerActionQuizData = (data) => {
    updateStreamManagerActionData({
      newData: data,
      actionName: STREAM_ACTION_NAME.QUIZ
    });
  };

  return (
    <>
      <Input
        label={$content.question}
        name="streamManagerActionFormQuestion"
        dataKey={QUIZ_DATA_KEYS.QUESTION}
        value={question}
        onChange={updateStreamManagerActionQuizData}
        placeholder={$content.question}
        error={currentStreamManagerActionErrors[QUIZ_DATA_KEYS.QUESTION]}
      />
      <RadioGroup
        addOptionButtonText={$content.add_answer}
        dataKey={QUIZ_DATA_KEYS.ANSWERS}
        optionErrors={currentStreamManagerActionErrors[QUIZ_DATA_KEYS.ANSWERS]}
        label={$content.answers}
        maxOptions={LIMITS[QUIZ_DATA_KEYS.ANSWERS].max}
        minOptions={LIMITS[QUIZ_DATA_KEYS.ANSWERS].min}
        name="streamManagerActionFormAnswers"
        options={answers}
        placeholder={$content.answer}
        selectedDataKey={QUIZ_DATA_KEYS.CORRECT_ANSWER_INDEX}
        selectedOptionIndex={correctAnswerIndex}
        updateData={updateStreamManagerActionQuizData}
      />
      <RangeSelector
        label={$content.duration}
        name="streamManagerActionFormDuration"
        dataKey={QUIZ_DATA_KEYS.DURATION}
        updateData={updateStreamManagerActionQuizData}
        value={duration}
        min={LIMITS[QUIZ_DATA_KEYS.DURATION].min}
        max={LIMITS[QUIZ_DATA_KEYS.DURATION].max}
      />
    </>
  );
};

export default Quiz;
