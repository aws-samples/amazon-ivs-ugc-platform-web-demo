import { clsm } from '../../../../utils';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Input from '../../../../components/Input';

const Quiz = () => {
  const { getStreamManagerActionData, updateStreamManagerActionData } =
    useStreamManagerActions();
  const { value } = getStreamManagerActionData(STREAM_ACTION_NAME.QUIZ);

  const handleOnChange = ({ target }) => {
    updateStreamManagerActionData(
      { value: target.value },
      STREAM_ACTION_NAME.QUIZ
    );
  };

  return (
    <Input
      className={clsm([
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-dark'
      ])}
      placeholder="Enter a value..."
      label="Quiz Value"
      name={STREAM_ACTION_NAME.QUIZ}
      value={value}
      onChange={handleOnChange}
    />
  );
};

export default Quiz;
