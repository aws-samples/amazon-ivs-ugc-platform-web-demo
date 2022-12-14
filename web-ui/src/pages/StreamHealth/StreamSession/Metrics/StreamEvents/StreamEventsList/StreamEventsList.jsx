import { forwardRef, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { Close } from '../../../../../../assets/icons';
import { clsm, noop } from '../../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../../content';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../../contexts/Streams';
import Button from '../../../../../../components/Button';
import MetricPanel from '../../MetricPanel';
import StreamEventItem from './StreamEventItem';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEventsList = forwardRef(
  (
    {
      isHidden,
      isLearnMoreVisible,
      isPreview,
      selectedEventId,
      setIsStreamEventsListVisible,
      setSelectedEventId,
      streamEvents,
      toggleLearnMore
    },
    wrapperRef
  ) => {
    const { isDefaultResponsiveView } = useResponsiveDevice();
    const {
      activeStreamSession = {},
      isLoadingStreamData,
      fetchActiveStreamSessionError
    } = useStreams();
    const selectedEventRef = useRef();
    const setSelectedEventRef = useCallback(
      (eventEl) => {
        const eventId = eventEl?.attributes['data-id'].value;
        if (eventId === selectedEventId) selectedEventRef.current = eventEl;
      },
      [selectedEventId]
    );

    const handleEventClick = (id) => {
      setSelectedEventId((prevId) => {
        if (prevId === id) {
          selectedEventRef.current = null;
          return null;
        }

        return id;
      });
    };

    const handleCloseEventsList = () => {
      setIsStreamEventsListVisible(false);
      setSelectedEventId(null);
    };

    useEffect(() => {
      setTimeout(
        () =>
          selectedEventRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          }),
        300
      );
    }, [selectedEventId]);

    useEffect(() => {
      const removeSpacebarScroll = (e) => {
        if (e.key === ' ') e.preventDefault();
      };

      const wrapper = wrapperRef.current;
      wrapper?.addEventListener('keypress', removeSpacebarScroll);

      return () =>
        wrapper?.removeEventListener('keypress', removeSpacebarScroll);
    }, [wrapperRef]);

    const hasEvents = !!streamEvents.length;

    return (
      <MetricPanel
        className={clsm(['h-full', isHidden && 'hidden'])}
        hasData={!isLoadingStreamData}
        header={
          isDefaultResponsiveView &&
          !isPreview && (
            <Button
              className={clsm(['mr-4', 'w-11', 'h-11'])}
              onClick={handleCloseEventsList}
              variant="icon"
            >
              <Close
                className={clsm([
                  'dark:fill-white',
                  'fill-lightMode-gray-dark'
                ])}
              />
            </Button>
          )
        }
        headerClassName={clsm(['pl-4', 'pt-8'])}
        isLoading={isLoadingStreamData}
        ref={wrapperRef}
        title={$content.stream_events}
        wrapper={{
          className: clsm([
            'dark:scrollbar-color-darkMode-gray',
            'h-full',
            'md:p-0',
            'md:pb-0',
            'overflow-x-hidden',
            'overflow-y-auto',
            'pr-4',
            'scrollbar-color-lightMode-gray',
            'scrollbar-mb-4',
            'scrollbar-mt-[-4px]',
            'space-y-4',
            'supports-overlay:overflow-y-overlay',
            (!hasEvents ||
              isLoadingStreamData ||
              fetchActiveStreamSessionError) &&
              'pb-20',
            !hasEvents && ['md:mt-11', 'md:mr-0', 'md:mb-8']
          ])
        }}
      >
        {hasEvents ? (
          streamEvents.map((streamEvent) => (
            <StreamEventItem
              key={streamEvent.id}
              handleEventClick={handleEventClick}
              isLive={activeStreamSession.isLive}
              selectedEventId={selectedEventId}
              setSelectedEventRef={setSelectedEventRef}
              streamEvent={streamEvent}
              toggleLearnMore={toggleLearnMore}
              isLearnMoreVisible={isLearnMoreVisible}
            />
          ))
        ) : (
          <span
            className={clsm([
              'dark:text-darkMode-gray-light',
              'flex-col',
              'flex',
              'h-full',
              'items-center',
              'justify-center',
              'space-y-2.5',
              'text-center',
              'text-lightMode-gray-medium'
            ])}
          >
            <h4
              className={clsm([
                'dark:text-darkMode-gray-light',
                'text-lightMode-gray-medium'
              ])}
            >
              {$content.no_stream_events}
            </h4>
            <p className={clsm(['max-w-[200px]', 'text-p2'])}>
              {$content.no_stream_events_message}
            </p>
          </span>
        )}
      </MetricPanel>
    );
  }
);

StreamEventsList.defaultProps = {
  isHidden: false,
  isLearnMoreVisible: false,
  isPreview: false,
  selectedEventId: null,
  setIsStreamEventsListVisible: noop,
  streamEvents: []
};

StreamEventsList.propTypes = {
  isHidden: PropTypes.bool,
  isLearnMoreVisible: PropTypes.bool,
  isPreview: PropTypes.bool,
  selectedEventId: PropTypes.string,
  setIsStreamEventsListVisible: PropTypes.func,
  setSelectedEventId: PropTypes.func.isRequired,
  streamEvents: PropTypes.array,
  toggleLearnMore: PropTypes.func.isRequired
};

export default StreamEventsList;
