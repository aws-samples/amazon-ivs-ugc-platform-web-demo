import { useOutletContext } from 'react-router-dom';
import PropTypes from 'prop-types';

import './EncoderConfiguration.css';
import { Copy, ErrorIcon } from '../../../../../assets/icons';
import { copyToClipboard, substitutePlaceholders } from '../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../content';
import { useNotif } from '../../../../../contexts/Notification';
import Button from '../../../../../components/Button';
import Tooltip from '../../../../../components/Tooltip';
import useStringOverflow from '../../../../../hooks/useStringOverflow';

const $content = $dashboardContent.stream_session_page.encoder_configuration;
const valueRegex = /({.+})/;

const ConfigRow = ({ label, value, error }) => {
  const { activeStreamSession, shouldShowSpinner } = useOutletContext();
  const [isValueOverflowing, valueRef] = useStringOverflow(value);
  const { notifySuccess } = useNotif();
  const renderedValue = shouldShowSpinner ? '----' : value;
  let ErrorMessage;

  if (error && $content.errors[error]) {
    ErrorMessage = (
      <>
        {$content.errors[error].split(valueRegex).map((strPart) =>
          !!strPart.match(valueRegex) ? (
            <span className="error-value" key={strPart}>
              {substitutePlaceholders(strPart, activeStreamSession)}
            </span>
          ) : (
            strPart
          )
        )}
      </>
    );
  }

  const handleCopy = (label, value) => {
    copyToClipboard(value);
    notifySuccess(`${label} ${$content.copied}`);
  };

  return (
    <span className={`config-item ${error ? 'error' : ''}`}>
      <h4 className="config-label">
        {label}
        {error && <ErrorIcon />}
      </h4>
      <span className="config-value">
        <Button
          ariaLabel={`${$content.copy_the_label.replace(
            '{label}',
            label.toLowerCase()
          )}`}
          ariaDisabled={shouldShowSpinner}
          {...(shouldShowSpinner
            ? {}
            : { onClick: () => handleCopy(label, value) })}
          variant="icon"
        >
          <Copy />
        </Button>
        {isValueOverflowing || ErrorMessage ? (
          <Tooltip
            hasFixedWidth={!!ErrorMessage}
            message={ErrorMessage || renderedValue}
          >
            <p className="encoder-value p1" ref={valueRef}>
              {renderedValue}
            </p>
          </Tooltip>
        ) : (
          <p className="encoder-value p1" ref={valueRef}>
            {renderedValue}
          </p>
        )}
      </span>
    </span>
  );
};

ConfigRow.defaultProps = { error: null };

ConfigRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  error: PropTypes.string
};

export default ConfigRow;
