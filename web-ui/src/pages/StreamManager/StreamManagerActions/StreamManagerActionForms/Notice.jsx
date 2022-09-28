import { clsm } from '../../../../utils';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Input from '../../../../components/Input';

const Notice = () => {
  const { getStreamManagerActionData, updateStreamManagerActionData } =
    useStreamManagerActions();
  const { value } = getStreamManagerActionData(STREAM_ACTION_NAME.NOTICE);

  const handleOnChange = ({ target }) => {
    updateStreamManagerActionData(
      { value: target.value },
      STREAM_ACTION_NAME.NOTICE
    );
  };

  return (
    <Input
      className={clsm([
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-dark'
      ])}
      placeholder="Enter a value..."
      label="Notice Value"
      name={STREAM_ACTION_NAME.NOTICE}
      value={value}
      onChange={handleOnChange}
    />
  );
};

export default Notice;
