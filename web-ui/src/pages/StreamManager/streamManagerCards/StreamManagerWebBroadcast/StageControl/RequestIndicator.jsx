import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';

const RequestIndicator = ({ stageRequestsCount, className }) => {
  return (
    <div
      className={clsm([
        'bg-darkMode-blue',
        'absolute',
        'rounded-full',
        'w-5',
        'h-5',
        'text-xs',
        'flex',
        'justify-center',
        'items-center',
        'text-black',
        className
      ])}
    >
      {stageRequestsCount}
    </div>
  );
};

RequestIndicator.propTypes = {
  stageRequestsCount: PropTypes.number.isRequired,
  className: PropTypes.string
};

RequestIndicator.defaultProps = {
  className: ''
};

export default RequestIndicator;
