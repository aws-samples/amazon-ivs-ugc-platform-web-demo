import PropTypes from 'prop-types';

import { clsm, noop } from '../utils';
import { useResponsiveDevice } from '../contexts/ResponsiveDevice';
import { useUser } from '../contexts/User';
import DataUnavailable from './DataUnavailable';
import Spinner from './Spinner';

const FULL_PAGE_DIV_BASE_CLASSES = [
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

const GridLayout = ({
  children,
  error,
  hasData,
  isLoading,
  noDataText,
  title,
  tryAgainFn,
  tryAgainText
}) => {
  const { isMobileView } = useResponsiveDevice();
  const { isSessionValid } = useUser();
  return (
    <div
      className={clsm(
        'bg-white',
        'dark:bg-black',
        'flex-col',
        'flex',
        'items-center',
        'lg:py-12',
        'overflow-x-hidden',
        'px-8',
        'py-24',
        'sm:px-4',
        'w-full',
        isMobileView && !isSessionValid && 'lg:pb-32',
        isMobileView && 'lg:px-4'
      )}
    >
      <section
        className={clsm([
          'max-w-[960px]',
          'h-full',
          'w-full',
          hasData && 'space-y-8'
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
            classNames={FULL_PAGE_DIV_BASE_CLASSES}
            noDataText={noDataText}
            error={error}
            tryAgainFn={tryAgainFn}
            tryAgainText={tryAgainText}
          />
        )}
        {isLoading && (
          <div className={clsm(FULL_PAGE_DIV_BASE_CLASSES)}>
            <Spinner size="large" variant="light" />
          </div>
        )}
      </section>
    </div>
  );
};

GridLayout.defaultProps = {
  error: '',
  hasData: undefined,
  isLoading: undefined,
  loadingError: '',
  noDataText: '',
  title: '',
  tryAgainFn: noop,
  tryAgainText: ''
};

GridLayout.propTypes = {
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  hasData: PropTypes.bool,
  isLoading: PropTypes.bool,
  noDataText: PropTypes.string,
  title: PropTypes.string,
  tryAgainFn: PropTypes.func,
  tryAgainText: PropTypes.string
};

export default GridLayout;
