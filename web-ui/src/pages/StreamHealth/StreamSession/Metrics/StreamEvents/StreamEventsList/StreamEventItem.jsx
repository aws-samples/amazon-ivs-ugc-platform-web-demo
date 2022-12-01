import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { m, useAnimation, useReducedMotion } from 'framer-motion';

import './StreamEventsList.css';
import { createAnimationProps } from '../../../../../../utils/animationPropsHelper';
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

  const eventItemClasses = ['event-item'];
  if (isSelected) eventItemClasses.push('selected');
  if (isExpandable) eventItemClasses.push('expandable');

  const handleEvent = (e) => {
    if (
      e.target.id !== 'learn-more-button' &&
      (e.keyCode === 32 || e.keyCode === 13 || e.type === 'click') // keyCode 32 => Spacebar, keyCode 13 => Enter
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

  return (
    <div data-id={id} ref={setSelectedEventRef}>
      <div
        aria-disabled={!isExpandable}
        aria-label={`${
          isSelected ? 'Hide' : 'Show'
        } description for the ${name.toLowerCase()} stream event`}
        className={eventItemClasses.join(' ')}
        onClick={handleEvent}
        onKeyUp={handleEvent}
        role="button"
        tabIndex={isExpandable ? '0' : '-1'}
      >
        <div className="event-header">
          <div className={`event-name${error ? ' error' : ''}`}>
            {isNameOverflowing ? (
              <Tooltip position="above" message={name}>
                <h4 ref={eventNameRef}>{name}</h4>
              </Tooltip>
            ) : (
              <h4 ref={eventNameRef}>{name}</h4>
            )}
            {error && <ErrorIcon className="error-icon" />}
            {success && <Check className="success-icon" />}
          </div>
          <p className="event-time p2" data-testid="stream-event-date-time">
            {eventTimestamp}
          </p>
        </div>
        {isExpandable && (
          <m.div
            className="event-description-container"
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
            <p className="event-description p1">{shortMsg}</p>
            {hasLearnMore && isSelected && (
              <div className="learn-more-button-container">
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
          </m.div>
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
