import PropTypes from 'prop-types';

import { Check, ErrorIcon } from '../../../assets/icons';
import { clsm } from '../../../utils';
import { dashboard as $dashboardContent } from '../../../content';
import Button from '../../../components/Button';
import LivePill from '../../../components/LivePill';
import useDateTime from '../../../hooks/useDateTime';

const $content = $dashboardContent.header.session_navigator;

const StreamSessionButton = ({ streamSession, handleSessionClick }) => {
  const { startTime, endTime, hasErrorEvent, isLive } = streamSession;
  const [date, time, dayDiff] = useDateTime(startTime, endTime, 5);
  return (
    <Button
      className={clsm([
        'bg-white',
        'dark:bg-darkMode-gray-medium',
        'dark:focus:bg-darkMode-gray-medium',
        'dark:hover:bg-darkMode-gray-medium-hover',
        'focus:bg-white',
        'h-[92px]',
        'hover:bg-white-hover',
        'justify-between',
        'px-8',
        'py-5',
        'w-full',
        hasErrorEvent
          ? ['[&>svg]:fill-lightMode-red', '[&>svg]:dark:fill-darkMode-red']
          : ['[&>svg]:fill-lightMode-green', '[&>svg]:dark:fill-darkMode-green']
      ])}
      onClick={() => handleSessionClick(streamSession)}
      variant="secondary"
      ariaLabel={`Navigate to stream session ${streamSession.streamId}`}
    >
      <div
        className={clsm(['items-start', 'flex', 'flex-col', 'space-y-1'])}
        data-testid="session-data"
      >
        <span
          className={clsm([
            'dark:text-white',
            'flex',
            'h-5',
            'items-center',
            'space-x-4',
            'xs:max-w-[152px]'
          ])}
        >
          <h3 className="truncate">{date}</h3>
          {isLive && <LivePill className="leading-normal" />}
        </span>
        <span className={clsm(['flex', 'space-x-0.5', 'xs:max-w-[152px]'])}>
          <p
            className={clsm([
              'dark:text-[#c7c7c7]',
              'text-p1',
              'truncate',
              'text-lightMode-gray-medium'
            ])}
          >
            {isLive ? `${$content.started} ${time}` : time}
          </p>
          {dayDiff > 0 && (
            <p
              className={clsm([
                'dark:text-[#c7c7c7]',
                'text-p3',
                'text-lightMode-gray-medium'
              ])}
            >
              +{dayDiff}d
            </p>
          )}
        </span>
      </div>
      {hasErrorEvent ? (
        <ErrorIcon className={clsm(['h-6', 'w-6'])} />
      ) : (
        <Check className={clsm(['h-6', 'w-6'])} />
      )}
    </Button>
  );
};

StreamSessionButton.propTypes = {
  streamSession: PropTypes.object.isRequired,
  handleSessionClick: PropTypes.func.isRequired
};

export default StreamSessionButton;
