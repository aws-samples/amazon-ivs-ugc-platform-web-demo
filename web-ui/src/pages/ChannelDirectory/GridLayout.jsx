import PropTypes from 'prop-types';

import { clsm, noop } from '../../utils';
import DataUnavailable from './DataUnavailable';
import Spinner from '../../components/Spinner';
import useCurrentPage from '../../hooks/useCurrentPage';

const PAGE_CENTERED_CONTENT_BASE_CLASSES = [
  'flex-col',
  'flex',
  'h-screen',
  'items-center',
  'justify-center',
  'left-0',
  'text-center',
  'top-0',
  'w-full'
];

const GridLayout = ({
  children,
  className,
  hasError,
  hasData,
  isLoading,
  noDataText,
  title,
  tryAgainFn,
  tryAgainText
}) => {
  const currentPage = useCurrentPage();
  const isFollowingPage = currentPage === 'following';

  return (
    <section
      className={clsm([
        'flex-col',
        'flex',
        'grow',
        'max-w-[960px]',
        'px-4',
        'w-[calc(100%_+_32px)]',
        isFollowingPage && 'h-full',
        hasData && 'space-y-8',
        className
      ])}
    >
      <h2 className={clsm(['text-black', 'dark:text-white'])}>{title}</h2>
      {!isLoading && hasData && (
        <div
          className={clsm([
            'gap-8',
            'grid-cols-3',
            'grid',
            'lg:grid-cols-2',
            'sm:grid-cols-1'
          ])}
        >
          {children}
        </div>
      )}
      {!isLoading && !hasData && (
        <DataUnavailable
          className={clsm([PAGE_CENTERED_CONTENT_BASE_CLASSES, 'space-y-8'])}
          noDataText={noDataText}
          hasError={hasError}
          tryAgainFn={tryAgainFn}
          tryAgainText={tryAgainText}
        />
      )}
      {isLoading && (
        <div className={clsm([PAGE_CENTERED_CONTENT_BASE_CLASSES])}>
          <Spinner size="large" variant="light" />
        </div>
      )}
    </section>
  );
};

GridLayout.defaultProps = {
  className: '',
  hasError: false,
  hasData: false,
  isLoading: false,
  loadingError: '',
  noDataText: '',
  title: '',
  tryAgainFn: noop,
  tryAgainText: ''
};

GridLayout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hasError: PropTypes.bool,
  hasData: PropTypes.bool,
  isLoading: PropTypes.bool,
  noDataText: PropTypes.string,
  title: PropTypes.string,
  tryAgainFn: PropTypes.func,
  tryAgainText: PropTypes.string
};

export default GridLayout;
