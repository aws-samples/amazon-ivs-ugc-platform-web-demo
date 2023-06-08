import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { dashboard as $dashboardContent } from '../../../../content';
import { NoData, SyncError } from '../../../../assets/icons';
import { useStreams } from '../../../../contexts/Streams';
import Spinner from '../../../../components/Spinner';

const $content = $dashboardContent.stream_session_page;

const errorContainerClasses = clsm([
  'dark:fill-darkMode-gray',
  'dark:text-darkMode-gray',
  'fill-lightMode-gray-medium',
  'flex-col',
  'flex',
  'h-full',
  'items-center',
  'justify-center',
  'relative',
  'space-y-1',
  'text-lightMode-gray-medium',
  'w-full'
]);

const MetricPanel = forwardRef(
  (
    {
      children,
      className,
      footer,
      hasData,
      header,
      headerClassName,
      isLoading,
      title,
      wrapper
    },
    wrapperRef
  ) => {
    const { fetchActiveStreamSessionError } = useStreams();
    const Wrapper = useMemo(() => wrapper.tag || 'div', [wrapper.tag]);

    const renderBody = () => {
      if (isLoading)
        return (
          <div
            className={clsm([
              'flex',
              'h-full',
              'items-center',
              'justify-center',
              'relative',
              'w-full'
            ])}
          >
            <Spinner size="medium" variant="semi-dark" />
          </div>
        );

      if (fetchActiveStreamSessionError)
        return (
          <div className={errorContainerClasses}>
            <SyncError />
            <p className="text-p3">{$content.failed_to_load}</p>
          </div>
        );

      if (!hasData)
        return (
          <div className={errorContainerClasses}>
            <NoData />
            <p className="text-p3">{$content.no_data_available}</p>
          </div>
        );

      return children;
    };

    return (
      <div
        className={clsm([
          'flex-col',
          'flex',
          'h-full',
          'md:bg-lightMode-gray-extraLight',
          'md:dark:bg-darkMode-gray-dark',
          className
        ])}
      >
        {(title || header) && (
          <div
            className={clsm([
              'flex',
              'items-center',
              'justify-between',
              'mb-4',
              headerClassName
            ])}
          >
            {title && (
              <h3
                className={clsm([
                  'dark:text-white',
                  'text-lightMode-gray-dark'
                ])}
              >
                {title}
              </h3>
            )}
            {header}
          </div>
        )}
        <Wrapper className={clsm(wrapper.className)} ref={wrapperRef}>
          {renderBody()}
        </Wrapper>
        {footer && (
          <div
            className={clsm([
              'flex',
              'h-5',
              'items-center',
              'justify-between',
              'mt-4'
            ])}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

MetricPanel.defaultProps = {
  children: null,
  className: '',
  footer: null,
  hasData: false,
  header: null,
  headerClassName: '',
  isLoading: false,
  title: '',
  wrapper: { tag: 'div', className: '' }
};

MetricPanel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  footer: PropTypes.node,
  hasData: PropTypes.bool,
  header: PropTypes.node,
  headerClassName: PropTypes.string,
  isLoading: PropTypes.bool,
  title: PropTypes.string,
  wrapper: PropTypes.shape({
    tag: PropTypes.string,
    className: PropTypes.string
  })
};

export default MetricPanel;
