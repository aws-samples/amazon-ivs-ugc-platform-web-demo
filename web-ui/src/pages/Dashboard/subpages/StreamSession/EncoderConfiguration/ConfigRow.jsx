import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { Copy, Error } from '../../../../../assets/icons';
import { copyToClipboard } from '../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../content';
import { useNotif } from '../../../../../contexts/Notification';
import Tooltip from '../../../../../components/Tooltip';
import './EncoderConfiguration.css';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

const ConfigRow = ({ label, value, error }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { notifySuccess } = useNotif();
  const valueRef = useRef();

  useEffect(() => {
    const updateOverflow = () => {
      if (valueRef.current) {
        const { offsetWidth, scrollWidth } = valueRef.current;
        setIsOverflowing(offsetWidth < scrollWidth);
      }
    };

    window.addEventListener('resize', updateOverflow);
    updateOverflow();

    return () => window.removeEventListener('resize', updateOverflow);
  }, [value]);

  const handleCopy = (label, value) => {
    copyToClipboard(value);
    notifySuccess(`${label} ${$content.copied}`);
  };

  return (
    <span className="config-item">
      <h4 className={`config-label ${error ? 'error' : ''}`}>
        {label}
        {error && <Error />}
      </h4>
      <span className={`config-value ${error ? 'error' : ''}`}>
        <button
          className="copy-button"
          onClick={() => handleCopy(label, value)}
          type="button"
        >
          <Copy />
        </button>
        {isOverflowing ? (
          <Tooltip message={value}>
            <p ref={valueRef}>{value}</p>
          </Tooltip>
        ) : (
          <p ref={valueRef}>{value}</p>
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
