import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import Switch from '../../../../../components/Switch';

const SwitchGroup = ({ icon, isDisabled, label, onChange, initialChecked }) => (
  <div className={clsm(['flex', 'w-full', 'justify-between'])}>
    <div
      className={clsm([
        'dark:[&>svg]:fill-darkMode-gray-extraLight',
        '[&>svg]:fill-lightMode-gray-medium',
        '[&>svg]:w-8',
        '[&>svg]:h-8',
        'flex',
        'items-center',
        'dark:text-darkMode-gray-extraLight',
        'font-bold',
        'text-light',
        'w-full',
        'space-x-3'
      ])}
    >
      {icon}
      <p>{label}</p>
    </div>
    <Switch
      ariaLabel={label}
      isDisabled={isDisabled}
      onChange={onChange}
      initialChecked={initialChecked}
    />
  </div>
);

SwitchGroup.defaultProps = {
  initialChecked: false,
  isDisabled: false,
  label: ''
};

SwitchGroup.propTypes = {
  icon: PropTypes.node.isRequired,
  initialChecked: PropTypes.bool,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default SwitchGroup;
