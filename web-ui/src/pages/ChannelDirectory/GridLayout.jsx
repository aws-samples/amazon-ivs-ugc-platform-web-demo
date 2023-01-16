import PropTypes from 'prop-types';

import { clsm, noop } from '../../utils';
import DataUnavailable from './DataUnavailable';
import Spinner from '../../components/Spinner';

const PAGE_CENTERED_CONTENT_BASE_CLASSES = [
  'absolute',
  'flex-col',
  'flex',
  'h-screen',
  'items-center',
  'justify-center',
  'left-0',
  'top-0',
  'w-full'
];

const SECTION_CENTERED_CONTENT_CLASSES = ['static', 'h-auto', 'grow'];

const GridLayout = ({
  children,
  className,
  error,
  hasData,
  isContentSectionCentered,
  isLoading,
  noDataText,
  title,
  tryAgainFn,
  tryAgainText
}) => (
  <section
    className={clsm([
      'flex-col',
      'flex',
      'grow',
      'max-w-[960px]',
      'px-4',
      'w-[calc(100%_+_32px)]',
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
        className={clsm([
          PAGE_CENTERED_CONTENT_BASE_CLASSES,
          'space-y-8',
          isContentSectionCentered && SECTION_CENTERED_CONTENT_CLASSES
        ])}
        noDataText={noDataText}
        error={error}
        tryAgainFn={tryAgainFn}
        tryAgainText={tryAgainText}
      />
    )}
    {isLoading && (
      <div
        className={clsm([
          PAGE_CENTERED_CONTENT_BASE_CLASSES,
          isContentSectionCentered && SECTION_CENTERED_CONTENT_CLASSES
        ])}
      >
        <Spinner size="large" variant="light" />
      </div>
    )}
  </section>
);

GridLayout.defaultProps = {
  className: '',
  error: '',
  hasData: false,
  isContentSectionCentered: true,
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
  error: PropTypes.string,
  hasData: PropTypes.bool,
  isContentSectionCentered: PropTypes.bool,
  isLoading: PropTypes.bool,
  noDataText: PropTypes.string,
  title: PropTypes.string,
  tryAgainFn: PropTypes.func,
  tryAgainText: PropTypes.string
};

export default GridLayout;
