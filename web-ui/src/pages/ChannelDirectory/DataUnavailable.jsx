import PropTypes from 'prop-types';

import { clsm, noop } from '../../utils';
import { SmartToy } from '../../assets/icons';
import Button from '../../components/Button';

const DataUnavailable = ({
  className,
  noDataText,
  error,
  tryAgainFn,
  tryAgainText
}) => (
  <div className={clsm([className, 'space-y-8'])}>
    <div
      className={clsm([
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'opacity-50',
        'space-y-2'
      ])}
    >
      <SmartToy
        className={clsm(['[&>path]:fill-black', '[&>path]:dark:fill-white'])}
      />
      <h3 className={clsm(['text-black', 'dark:text-white'])}>{noDataText}</h3>
    </div>
    {!!error && (
      <Button onClick={tryAgainFn} variant="secondary">
        {tryAgainText}
      </Button>
    )}
  </div>
);

DataUnavailable.defaultProps = {
  className: '',
  error: '',
  noDataText: '',
  tryAgainFn: noop,
  tryAgainText: ''
};

DataUnavailable.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  noDataText: PropTypes.string,
  tryAgainFn: PropTypes.func,
  tryAgainText: PropTypes.string
};

export default DataUnavailable;
