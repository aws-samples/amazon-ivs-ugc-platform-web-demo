import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';

import { clsm } from '../../../../utils';
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
const commonErrorClasses = clsm([
  'dark:text-darkMode-red',
  'text-lightMode-red'
]);

const commonClasses = clsm([
  '[&>svg]:fill-lightMode-red',
  '[&>svg]:ml-[6px]',
  '[&>svg]:shrink-0',
  'dark:[&>svg]:fill-darkMode-red',
  'dark:text-darkMode-gray-light',
  'flex',
  'items-center',
  'min-w-[168px]',
  'relative',
  'text-lightMode-gray-dark'
]);

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
      className={clsm([
        'text-[15px]',
        'leading-[22.5px]',
        'font-normal',
        'truncate',
        'dark:text-white',
        'text-lightMode-gray-dark',
        hasError && commonErrorClasses
      ])}
      data-testid={`${label.toLowerCase().replace(/\s/g, '-')}-config-label`}
      ref={valueRef}
    >
      {renderedValue}
    </p>
  );

  return (
    <span
      className={clsm([
        'flex',
        'items-center',
        'max-h-6',
        'space-x-8',
        'sm:items-start',
        'sm:flex-col',
        'sm:space-y-2.5',
        'sm:space-x-0',
        'sm:max-h-[none]'
      ])}
    >
      {renderedValue !== NO_DATA_VALUE && !!ErrorMessage ? (
        <Tooltip hasFixedWidth message={ErrorMessage}>
          <h4 className={clsm([commonClasses, hasError && commonErrorClasses])}>
            {label}
            {hasError && <ErrorIcon />}
          </h4>
        </Tooltip>
      ) : (
        <h4 className={clsm([commonClasses, hasError && commonErrorClasses])}>
          {label}
          {hasError && <ErrorIcon />}
        </h4>
      )}
      <span
        className={clsm([
          'flex-1',
          'flex',
          'items-center',
          'lg:max-w-none',
          'lg:space-x-2.5',
          'lg:w-full',
          'min-w-0',
          'space-x-1',
          'w-52',
          hasError && commonErrorClasses
        ])}
      >
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
