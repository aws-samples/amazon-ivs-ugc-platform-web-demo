import { bound, clsm } from '../../../../utils';
import { INPUT_BASE_CLASSES } from '../../../../components/Input/InputTheme';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Input from '../../../../components/Input';

const Quiz = () => {
  const { getStreamManagerActionData, updateStreamManagerActionData } =
    useStreamManagerActions();
  const { value, duration } = getStreamManagerActionData(
    STREAM_ACTION_NAME.QUIZ
  );

  // TEMPORARY
  const handleOnChange = ({ target }) => {
    const { name } = target;
    let { value } = target;
    if (name === 'duration') value = value ? bound(value, 0) : '';

    updateStreamManagerActionData({ [name]: value }, STREAM_ACTION_NAME.QUIZ);
  };

  return (
    // ALL OF THIS IS TEMPORARY (only meant for demonstration purposes)
    <div className={clsm(['flex', 'flex-col', 'gap-y-6'])}>
      <Input
        autoComplete="off"
        className={clsm([
          INPUT_BASE_CLASSES,
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-dark'
        ])}
        label="Quiz Value"
        name="value"
        onChange={handleOnChange}
        placeholder="Enter a value..."
        value={value}
      />
      <input
        autoComplete="off"
        className={clsm([
          INPUT_BASE_CLASSES,
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-dark'
        ])}
        name="duration"
        onChange={handleOnChange}
        placeholder="Enter a duration..."
        type="number"
        value={duration}
      />
    </div>
  );
};

export default Quiz;
