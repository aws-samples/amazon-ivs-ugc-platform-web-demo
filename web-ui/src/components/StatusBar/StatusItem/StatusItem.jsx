import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import StatusItemTooltip from './StatusItemTooltip';
import StatusItemWrapper from './StatusItemWrapper';
import { app as $appContent } from '../../../content';

const $content = $appContent.status_bar;

const StatusItem = ({
  icon,
  isLive,
  isStreamHealthPage,
  onClick,
  concurrentViewsTooltipText,
  value,
  hasError
}) => (
  <div className="flex">
    <StatusItemTooltip text={concurrentViewsTooltipText}>
      <StatusItemWrapper isActionable={!!onClick} onClick={onClick}>
        <div
          className={clsm([
            'flex',
            'items-center',
            'justify-center',
            '[&>svg]:w-[18px]',
            '[&>svg]:h-[18px]',
            isLive
              ? ['[&>svg]:fill-black', 'dark:[&>svg]:fill-white']
              : [
                  '[&>svg]:fill-lightMode-gray',
                  'dark:[&>svg]:fill-darkMode-gray'
                ]
          ])}
        >
          {icon}
        </div>
        <p
          className={clsm([
            'p2',
            'text-black',
            'dark:text-white',
            hasError &&
              typeof value === 'number' && [
                'text-lightMode-red',
                'dark:text-darkMode-red'
              ]
          ])}
        >
          {value}
        </p>
        {!isLive && isStreamHealthPage && typeof value === 'number' && (
          <p className="p2">{$content.avg}</p>
        )}
      </StatusItemWrapper>
    </StatusItemTooltip>
  </div>
);

StatusItem.defaultProps = {
  isLive: false,
  isStreamHealthPage: false,
  onClick: null,
  concurrentViewsTooltipText: '',
  hasError: false
};

StatusItem.propTypes = {
  icon: PropTypes.node.isRequired,
  isLive: PropTypes.bool,
  isStreamHealthPage: PropTypes.bool,
  onClick: PropTypes.func,
  concurrentViewsTooltipText: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hasError: PropTypes.bool
};
export default StatusItem;
