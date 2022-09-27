import { clsm } from '../../../../utils';
import { STREAM_ACTION_NAME } from '../../../../constants';
import { useManagerStreamActions } from '../../../../contexts/ManagerStreamActions';
import Input from '../../../../components/Input';

const Quiz = () => {
  const { getManagerStreamActionData, updateManagerStreamActionData } =
    useManagerStreamActions();
  const { value } = getManagerStreamActionData(STREAM_ACTION_NAME.QUIZ);

  const handleOnChange = ({ target }) => {
    updateManagerStreamActionData(
      { value: target.value },
      STREAM_ACTION_NAME.QUIZ
    );
  };

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'p-10',
        'rounded-3xl',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-dark'
      ])}
    >
      <Input
        label="Value"
        name="quiz"
        value={value}
        onChange={handleOnChange}
      />
    </div>
  );
};

export default Quiz;
