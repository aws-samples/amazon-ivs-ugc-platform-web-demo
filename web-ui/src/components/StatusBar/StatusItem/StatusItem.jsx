import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import StatusItemTooltip from './StatusItemTooltip';
import StatusItemWrapper from './StatusItemWrapper';

const StatusItem = ({
  concurrentViewsTooltipText,
  hasError,
  icon,
  isLive,
  onClick,
  value
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
        {value !== null && (
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
        )}
      </StatusItemWrapper>
    </StatusItemTooltip>
  </div>
);

StatusItem.defaultProps = {
  concurrentViewsTooltipText: '',
  hasError: false,
  isLive: false,
  onClick: null,
  value: null
};

StatusItem.propTypes = {
  concurrentViewsTooltipText: PropTypes.string,
  hasError: PropTypes.bool,
  icon: PropTypes.node.isRequired,
  isLive: PropTypes.bool,
  onClick: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
export default StatusItem;
