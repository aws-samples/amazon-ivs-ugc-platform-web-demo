import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';

import { dashboard as $content } from '../../content';
import { useNotif } from '../../contexts/Notification';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { clsm } from '../../utils';
import { INPUT_BUTTON_GROUP_CLASSES } from './SettingsTheme';

const CopyTextInput = ({ label, name, successMessage, value = '' }) => {
  const { notifySuccess } = useNotif();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const inputVariant = isDefaultResponsiveView ? 'vertical' : 'horizontal';

  const handleCopyAndNotify = () => {
    copyToClipboard(value);
    notifySuccess(successMessage);
  };

  return (
    <span className={clsm(INPUT_BUTTON_GROUP_CLASSES)}>
      <Input
        label={label}
        name={name}
        placeholder={label}
        readOnly
        value={value}
        variant={inputVariant}
      />
      <Button
        onClick={handleCopyAndNotify}
        variant="tertiary"
        ariaLabel={`Copy ${label} value`}
      >
        {$content.settings_page.copy}
      </Button>
    </span>
  );
};

CopyTextInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  successMessage: PropTypes.string.isRequired,
  value: PropTypes.string
};

export default CopyTextInput;
