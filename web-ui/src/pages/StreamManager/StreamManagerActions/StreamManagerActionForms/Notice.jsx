import {
  NOTICE_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../../../constants';
import { clsm } from '../../../../utils';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Input from './formElements/Input';
import RangeSelector from './formElements/RangeSelector';

const $content = $streamManagerContent.stream_manager_actions.notice;
const LIMITS = STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.NOTICE];

const INPUT_BASE_CLASSES = [
  'bg-lightMode-gray-light',
  'dark:bg-darkMode-gray-dark'
];

const Notice = () => {
  const {
    currentStreamManagerActionErrors,
    getStreamManagerActionData,
    updateStreamManagerActionData
  } = useStreamManagerActions();
  const { duration, message, title } = getStreamManagerActionData(
    STREAM_ACTION_NAME.NOTICE
  );

  const updateStreamManagerActionNoticeData = (data) => {
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: STREAM_ACTION_NAME.NOTICE
    });
  };

  return (
    <>
      <Input
        className={clsm(INPUT_BASE_CLASSES)}
        dataKey={NOTICE_DATA_KEYS.TITLE}
        label={$content.title}
        name="streamManagerActionFormTitle"
        onChange={updateStreamManagerActionNoticeData}
        placeholder={$content.title}
        error={currentStreamManagerActionErrors[NOTICE_DATA_KEYS.TITLE]}
        value={title}
      />
      <Input
        className={clsm(INPUT_BASE_CLASSES)}
        dataKey={NOTICE_DATA_KEYS.MESSAGE}
        label={$content.message}
        name="streamManagerActionFormMessage"
        onChange={updateStreamManagerActionNoticeData}
        placeholder={$content.message}
        error={currentStreamManagerActionErrors[NOTICE_DATA_KEYS.MESSAGE]}
        value={message}
      />
      <RangeSelector
        dataKey={NOTICE_DATA_KEYS.DURATION}
        label={$content.duration}
        max={LIMITS[NOTICE_DATA_KEYS.DURATION].max}
        min={LIMITS[NOTICE_DATA_KEYS.DURATION].min}
        name="streamManagerActionFormDuration"
        updateData={updateStreamManagerActionNoticeData}
        value={duration}
      />
    </>
  );
};

export default Notice;
