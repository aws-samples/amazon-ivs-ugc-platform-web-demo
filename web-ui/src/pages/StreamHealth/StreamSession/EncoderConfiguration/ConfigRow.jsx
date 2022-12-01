import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';

import './EncoderConfiguration.css';
import { Copy, ErrorIcon } from '../../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../../content';
import { NO_DATA_VALUE } from '../../../../constants';
import { substitutePlaceholders } from '../../../../utils';
import { useNotif } from '../../../../contexts/Notification';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import Tooltip from '../../../../components/Tooltip';
import useStringOverflow from '../../../../hooks/useStringOverflow';

const $content = $dashboardContent.stream_session_page.encoder_configuration;
const valueRegex = /({.+})/;

const ConfigRow = ({ label, value, error }) => {
  const { activeStreamSession, isLoadingStreamData } = useStreams();
  const { notifySuccess } = useNotif();
  const renderedValue = isLoadingStreamData ? NO_DATA_VALUE : value;
  const [isValueOverflowing, valueRef] = useStringOverflow(renderedValue);
  const hasError = !!error && !isLoadingStreamData;
  let ErrorMessage;

  if (hasError && $content.errors[error]) {
    ErrorMessage = (
      <>
        {$content.errors[error].split(valueRegex).map((strPart) =>
          !!strPart.match(valueRegex) ? (
            <span className="text-darkMode-red" key={strPart}>
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

  const getEncoderValueElement = () => (
    <p
      className="encoder-value p1"
      data-testid={`${label.toLowerCase().replace(/\s/g, '-')}-config-label`}
      ref={valueRef}
    >
      {renderedValue}
    </p>
  );

  return (
    <span className={`config-item ${hasError ? 'error' : ''}`}>
      {renderedValue !== NO_DATA_VALUE && !!ErrorMessage ? (
        <Tooltip hasFixedWidth message={ErrorMessage}>
          <h4 className="config-label">
            {label}
            {hasError && <ErrorIcon />}
          </h4>
        </Tooltip>
      ) : (
        <h4 className="config-label">
          {label}
          {hasError && <ErrorIcon />}
        </h4>
      )}
      <span className="config-value">
        <Button
          ariaLabel={`${$content.copy_the_label.replace(
            '{label}',
            label.toLowerCase()
          )}`}
          isDisabled={renderedValue === NO_DATA_VALUE}
          {...(isLoadingStreamData
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
            {getEncoderValueElement()}
          </Tooltip>
        ) : (
          getEncoderValueElement()
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
