import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import { INPUT_BASE_CLASSES } from '../../../../../components/Input/InputTheme';
import Label from '../../../../../components/Input/InputLabel';

const StreamManagerActionTextArea = ({
  cols,
  dataKey,
  label,
  maxLength,
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
        maxLength={maxLength}
        name={name}
        onChange={handleOnChange}
        placeholder={placeholder}
        value={value}
        wrap="hard"
        required
        autoComplete="off"
      />
    </div>
  );
};

StreamManagerActionTextArea.defaultProps = {
  cols: '20',
  label: '',
  maxLength: undefined,
  placeholder: '',
  rows: '4',
  value: ''
};

StreamManagerActionTextArea.propTypes = {
  cols: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  maxLength: PropTypes.number,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerActionTextArea;
