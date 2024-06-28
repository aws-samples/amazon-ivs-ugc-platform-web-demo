import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AMAZON_PRODUCT_DATA_KEYS } from '../../../../../../constants';
import { clsm, noop } from '../../../../../../utils';
import { Search } from '../../../../../../assets/icons';
import Input from '../formElements/Input';

export const SearchGroup = ({
  errors = {},
  keyword = '',
  onBlur = noop,
  onChange = noop,
  placeholder = ''
}) => {
  const keywordSearchFieldRef = useRef();

  useEffect(() => keywordSearchFieldRef.current?.focus(), []);

  return (
    <div
      className={clsm([
        '[&>svg]:dark:fill-white',
        '[&>svg]:fill-black',
        'active:[&>svg]:dark:fill-white',
        'hover:[&>svg]:dark:fill-darkMode-gray-light-hover',
        'pr-3',
        'relative',
        'w-full',
        keyword === '' && [
          '[&>svg]:dark:fill-darkMode-gray-light',
          '[&>svg]:fill-lightMode-gray-medium'
        ]
      ])}
    >
      <Input
        className="pl-[60px]"
        dataKey={AMAZON_PRODUCT_DATA_KEYS.KEYWORD}
        error={errors[AMAZON_PRODUCT_DATA_KEYS.KEYWORD]}
        name="streamManagerActionFormKeywordSearch"
        onBlur={(event) => onBlur(event)}
        onChange={onChange}
        placeholder={placeholder}
        value={keyword}
        ref={keywordSearchFieldRef}
        autoComplete="off"
      />
      <Search
        className={clsm(['w-6', 'h-6', 'absolute', 'top-2.5', 'left-5'])}
      />
    </div>
  );
};

SearchGroup.propTypes = {
  errors: PropTypes.object,
  keyword: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  placeholder: PropTypes.string
};

export default SearchGroup;
