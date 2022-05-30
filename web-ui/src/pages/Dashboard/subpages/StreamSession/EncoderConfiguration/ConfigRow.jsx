import PropTypes from 'prop-types';

import { Copy, ErrorIcon } from '../../../../../assets/icons';
import { copyToClipboard } from '../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../content';
import { useNotif } from '../../../../../contexts/Notification';
import Tooltip from '../../../../../components/Tooltip';
import useStringOverflow from '../../../../../hooks/useStringOverflow';
import './EncoderConfiguration.css';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

const ConfigRow = ({ label, value, error }) => {
  const [isValueOverflowing, valueRef] = useStringOverflow(value);
  const { notifySuccess } = useNotif();

  const handleCopy = (label, value) => {
    copyToClipboard(value);
    notifySuccess(`${label} ${$content.copied}`);
  };

  return (
    <span className="config-item">
      <h4 className={`config-label ${error ? 'error' : ''}`}>
        {label}
        {error && <ErrorIcon />}
      </h4>
      <span className={`config-value ${error ? 'error' : ''}`}>
        <button
          className="copy-button"
          onClick={() => handleCopy(label, value)}
          type="button"
        >
          <Copy />
        </button>
        {isValueOverflowing ? (
          <Tooltip message={value}>
            <p className="encoder-value p1" ref={valueRef}>
              {value}
            </p>
          </Tooltip>
        ) : (
          <p className="encoder-value p1" ref={valueRef}>
            {value}
          </p>
        )}
      </span>
    </span>
  );
};

ConfigRow.defaultProps = { error: false };

ConfigRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  error: PropTypes.bool
};

export default ConfigRow;
