import PropTypes from 'prop-types';
import { clsm } from '../../../utils';
import StatusItemTooltip from './StatusItemTooltip';
import StatusItemWrapper from './StatusItemWrapper';

const StatusItem = ({
  concurrentViewsTooltipText,
  dataTestId,
  hasError,
  icon,
  isLive,
  itemLabel,
  itemButtonProps,
  role,
  value,
  className
}) => (
  <div className={clsm(['flex', 'max-w-[92px]', 'sm:[&>div]:px-0', className])}>
    <StatusItemTooltip text={concurrentViewsTooltipText}>
      <StatusItemWrapper
        isActionable={!!itemButtonProps}
        itemButtonProps={itemButtonProps}
      >
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
            {...(role ? { role } : {})}
            aria-label={itemLabel}
            className={clsm([
              'dark:text-white',
              'text-black',
              'text-p2',
              hasError &&
                typeof value === 'number' && [
                  'text-lightMode-red',
                  'dark:text-darkMode-red'
                ]
            ])}
            data-testid={dataTestId}
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
  itemButtonProps: null,
  role: '',
  value: null,
  className: ''
};

StatusItem.propTypes = {
  concurrentViewsTooltipText: PropTypes.string,
  dataTestId: PropTypes.string.isRequired,
  hasError: PropTypes.bool,
  icon: PropTypes.node.isRequired,
  isLive: PropTypes.bool,
  itemLabel: PropTypes.string.isRequired,
  itemButtonProps: PropTypes.shape({ onClick: PropTypes.func }),
  role: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
};

export default StatusItem;
