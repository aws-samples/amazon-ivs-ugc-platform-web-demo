import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import StatusItemWrapper from './StatusItemWrapper';
import StatusItemTooltip from './StatusItemTooltip';

const StatusItem = ({ ariaLabel, icon, onClick, tooltipText, value }) => (
  <div className="flex">
    <StatusItemTooltip text={tooltipText}>
      <StatusItemWrapper isActionable={!!onClick} onClick={onClick}>
        <div
          className={clsm([
            'flex',
            'items-center',
            'justify-center',
            '[&>svg]:w-[18px]',
            '[&>svg]:h-[18px]',
            '[&>svg]:fill-lightMode-gray',
            'dark:[&>svg]:fill-darkMode-gray'
          ])}
        >
          {icon}
        </div>
        <p className={clsm(['p2', 'text-black', 'dark:text-white'])}>{value}</p>
      </StatusItemWrapper>
    </StatusItemTooltip>
  </div>
);

StatusItem.propTypes = {
  ariaLabel: PropTypes.string,
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  tooltipText: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

StatusItem.defaultProps = {
  ariaLabel: '',
  onClick: null,
  tooltipText: ''
};

export default StatusItem;
