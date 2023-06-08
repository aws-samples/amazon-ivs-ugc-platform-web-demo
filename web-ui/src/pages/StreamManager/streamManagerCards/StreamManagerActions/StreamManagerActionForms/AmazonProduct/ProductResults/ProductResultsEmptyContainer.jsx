import PropTypes from 'prop-types';

import { Search } from '../../../../../../../assets/icons';
import { clsm } from '../../../../../../../utils';

const ProductResultsEmptyContainer = ({
  className,
  emptyText,
  keyword,
  noResultsText,
  searched,
  isValidKeyword
}) => {
  const hasNoResults = isValidKeyword && searched && keyword !== '';
  return (
    <div className={clsm(className)}>
      <Search
        className={clsm([
          'dark:fill-darkMode-gray-light',
          'fill-lightMode-gray',
          'h-14',
          'w-14'
        ])}
      />
      <p
        className={clsm([
          'break-anywhere',
          'dark:text-darkMode-gray-light',
          'line-clamp-2',
          'pt-3',
          'text-center',
          'text-lightMode-gray',
          'text-p1'
        ])}
      >
        {hasNoResults ? `${noResultsText} "${keyword}"` : `${emptyText}`}
      </p>
    </div>
  );
};

ProductResultsEmptyContainer.propTypes = {
  className: PropTypes.string,
  emptyText: PropTypes.string,
  keyword: PropTypes.string.isRequired,
  noResultsText: PropTypes.string,
  searched: PropTypes.bool.isRequired,
  isValidKeyword: PropTypes.bool.isRequired
};

ProductResultsEmptyContainer.defaultProps = {
  className: '',
  emptyText: '',
  keyword: '',
  noResultsText: ''
};

export default ProductResultsEmptyContainer;
