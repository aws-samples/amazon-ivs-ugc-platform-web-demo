import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { createAnimationProps } from '../../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../../content';
import { ErrorIcon, Check } from '../../../../../../assets/icons';
import { formatDate, formatTime } from '../../../../../../hooks/useDateTime';
import Button from '../../../../../../components/Button';
import Tooltip from '../../../../../../components/Tooltip';
import usePrevious from '../../../../../../hooks/usePrevious';
import useStringOverflow from '../../../../../../hooks/useStringOverflow';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEventItem = ({
  handleEventClick,
  isLive,
  selectedEventId,
  setSelectedEventRef,
  streamEvent,
  toggleLearnMore,
  isLearnMoreVisible
}) => {
  const controls = useAnimation();
  const shouldReduceMotion = useReducedMotion();
  const learnMoreBtnRef = useRef();
  const prevIsLearnMoreVisible = usePrevious(isLearnMoreVisible);
  const [isNameOverflowing, eventNameRef] = useStringOverflow();
  const { id, name, error, success, eventTime, shortMsg, longMsg } =
    streamEvent;
  const isSelected = id === selectedEventId;
  const isExpandable = !!shortMsg;
  const hasLearnMore = !!longMsg;
  const date = formatDate(eventTime);
  const time = formatTime(eventTime, null, isLive);
  let eventTimestamp = isLive ? time : `${date} ${time}`;
  eventTimestamp =
    eventTimestamp.charAt(0).toUpperCase() + eventTimestamp.slice(1);

  const handleEvent = (e) => {
    if (
      e.target.id !== 'learn-more-button' &&
      (e.key === ' ' || e.key === 'Enter' || e.type === 'click')
    ) {
      handleEventClick(id);
    }
  };

  // Return focus back to the "learn more" button after closing the "learn more" panel
  useEffect(() => {
    if (
      isExpandable &&
      isSelected &&
      prevIsLearnMoreVisible &&
      !isLearnMoreVisible
    ) {
      learnMoreBtnRef.current?.focus();
    }
  }, [isExpandable, isLearnMoreVisible, isSelected, prevIsLearnMoreVisible]);

  useEffect(() => {
    const variant = isSelected ? 'visible' : 'hidden-initial';

    if (shouldReduceMotion) {
      controls.set(variant);
    } else {
      controls.start(variant);
    }
  }, [controls, isSelected, shouldReduceMotion]);

  const renderEventName = () => (
    <h4
      className={clsm([
        'dark:text-white',
        'text-lightMode-gray-dark',
        'truncate',
        error && ['dark:text-darkMode-red', 'text-lightMode-red']
      ])}
      ref={eventNameRef}
    >
      {name}
    </h4>
  );

  return (
    <div data-id={id} ref={setSelectedEventRef}>
      <div
        aria-disabled={!isExpandable}
        aria-label={`${
          isSelected ? 'Hide' : 'Show'
        } description for the ${name.toLowerCase()} stream event`}
        className={clsm([
          'event-item',
          'cursor-auto',
          'flex-col',
          'flex',
          'justify-center',
          'overflow-hidden',
          'pointer-events-auto',
          'rounded-3xl',
          'transition-colors',
          isExpandable && [
            'cursor-pointer',
            'dark:focus:bg-darkMode-gray-medium',
            'dark:hover:bg-darkMode-gray-medium',
            'dark:shadow-white',
            'focus:bg-lightMode-gray-light',
            'focus:outline-none',
            'focus:shadow-focus',
            'hover:bg-lightMode-gray-light',
            'shadow-black',
            isSelected && [
              'bg-lightMode-gray-light',
              'dark:bg-darkMode-gray-medium'
            ]
          ]
        ])}
        onClick={handleEvent}
        onKeyUp={handleEvent}
        role="button"
        tabIndex={isExpandable ? '0' : '-1'}
      >
        <div className={clsm(['text-left', 'p-4'])}>
          <div
            className={clsm([
              'items-center',
              'flex',
              'justify-between',
              'pb-1.5'
            ])}
          >
            {isNameOverflowing ? (
              <Tooltip position="above" message={name}>
                {renderEventName()}
              </Tooltip>
            ) : (
              renderEventName()
            )}
            {error && (
              <ErrorIcon
                className={clsm([
                  'dark:fill-darkMode-red',
                  'fill-lightMode-red',
                  'h-5',
                  'w-5',
                  'ml-8'
                ])}
              />
            )}
            {success && (
              <Check
                className={clsm([
                  'dark:fill-darkMode-green',
                  'fill-lightMode-green',
                  'h-5',
                  'w-5',
                  'ml-8'
                ])}
              />
            )}
          </div>
          <p
            className={clsm([
              'dark:text-darkMode-gray-light',
              'text-lightMode-gray-medium',
              'text-p2'
            ])}
            data-testid="stream-event-date-time"
          >
            {eventTimestamp}
          </p>
        </div>
        {isExpandable && (
          <motion.div
            key="event-content"
            {...createAnimationProps({
              animations: ['fadeIn-full'],
              customVariants: {
                hidden: { height: 0 },
                visible: { height: 'auto' }
              },
              controls,
              transition: 'bounce'
            })}
          >
            <p
              className={clsm([
                'break-anywhere',
                'text-p1',
                'mx-4',
                'my-0',
                'pb-4'
              ])}
            >
              {shortMsg}
            </p>
            {hasLearnMore && isSelected && (
              <div className="m-4">
                <Button
                  className={clsm([
                    'pointer-events-auto',
                    'w-full',
                    'bg-darkMode-gray',
                    'hover:bg-darkMode-gray-hover'
                  ])}
                  id="learn-more-button"
                  onClick={() => toggleLearnMore(true)}
                  ref={learnMoreBtnRef}
                  variant="secondary"
                >
                  {$content.learn_how_to_fix_it}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

StreamEventItem.defaultProps = {
  isLive: false,
  selectedEventId: null
};

StreamEventItem.propTypes = {
  handleEventClick: PropTypes.func.isRequired,
  isLearnMoreVisible: PropTypes.bool.isRequired,
  isLive: PropTypes.bool,
  selectedEventId: PropTypes.string,
  setSelectedEventRef: PropTypes.func.isRequired,
  streamEvent: PropTypes.object.isRequired,
  toggleLearnMore: PropTypes.func.isRequired
};

export default StreamEventItem;
