import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import {
  INPUT_BASE_CLASSES,
  INPUT_ERROR_CLASSES
} from '../../../../../components/Input/InputTheme';
import InputErrorMessage from '../../../../../components/Input/InputErrorMessage';
import Label from '../../../../../components/Input/InputLabel';

const StreamManagerActionTextArea = ({
  cols,
  dataKey,
  error,
  label,
  name,
  onChange,
  placeholder,
  rows,
  value
}) => {
  const handleOnChange = ({ target }) => {
    onChange({ [dataKey]: target.value });
  };

  return (
    <div className={clsm(['flex', 'flex-col'])}>
      {label && <Label label={label} htmlFor={name} />}
      <textarea
        className={clsm([
          INPUT_BASE_CLASSES,
          error && INPUT_ERROR_CLASSES,
          'resize-none',
          'h-[100px]',
          'px-5',
          'py-[13px]',
          'scroll-py-[13px]',
          'leading-[18.15px]',
          'dark:bg-darkMode-gray-dark',
          'no-scrollbar'
        ])}
        id={name}
        name={name}
        onChange={handleOnChange}
        placeholder={placeholder}
        value={value}
        wrap="hard"
        required
        autoComplete="off"
      />
      <InputErrorMessage error={error} />
    </div>
  );
};

StreamManagerActionTextArea.defaultProps = {
  cols: '20',
  error: '',
  label: '',
  placeholder: '',
  rows: '4',
  value: ''
};

StreamManagerActionTextArea.propTypes = {
  cols: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  error: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerActionTextArea;
