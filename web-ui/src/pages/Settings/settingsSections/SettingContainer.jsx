import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { SETTINGS_ORIENTATION, useSettingsOrientation } from '../Settings';
import InputLabel from '../../../components/Input/InputLabel';

const SettingContainer = ({ label, children }) => {
  const settingsFormOrientation = useSettingsOrientation();

  return (
    <div
      className={clsm([
        'relative',
        'flex',
        'items-center',
        'min-w-[90px]',
        'pr-[108px]',
        settingsFormOrientation === SETTINGS_ORIENTATION.VERTICAL && [
          'flex-col',
          'items-start'
        ]
      ])}
    >
      {label && <InputLabel label={label} variant={settingsFormOrientation} />}
      <div
        className={clsm([
          'p-5',
          'w-full',
          'min-h-[88px]',
          'rounded-3xl',
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-medium'
        ])}
      >
        {children}
      </div>
    </div>
  );
};

SettingContainer.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string
};

SettingContainer.defaultProps = { label: '' };

export default SettingContainer;
