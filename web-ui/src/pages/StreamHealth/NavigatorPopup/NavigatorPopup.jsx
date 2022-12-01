import PropTypes from 'prop-types';
import { forwardRef, useEffect, useRef } from 'react';
import { m } from 'framer-motion';

import './NavigatorPopup.css';
import { createAnimationProps } from '../../../utils/animationPropsHelper';
import { dashboard as $dashboardContent } from '../../../content';
import { groupStreamSessions } from '../Header/utils';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../contexts/Streams';
import Button from '../../../components/Button';
import StreamSessionButton from './StreamSessionButton';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ isNavOpen, toggleNavPopup }, ref) => {
  const {
    canLoadMoreStreamSessions,
    isLoadingNextStreamSessionsPage,
    streamSessions,
    updateActiveStreamSession,
    throttledUpdateStreamSessions
  } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const loadMoreSessionsBtnRef = useRef();

  const handleSessionClick = (streamSession) => {
    updateActiveStreamSession(streamSession);
    toggleNavPopup();
  };

  const handleLoadMoreStreamSessions = () => {
    throttledUpdateStreamSessions(true);
  };

  useEffect(() => {
    if (!isLoadingNextStreamSessionsPage) {
      loadMoreSessionsBtnRef.current?.blur();
    }
  }, [isLoadingNextStreamSessionsPage]);

  const renderPopup = () => (
    <m.div
      {...createAnimationProps({
        customVariants: {
          hidden: { y: '-12.5%' },
          visible: { y: 0 }
        },
        transition: {
          damping: 25,
          duration: 0.15,
          stiffness: 350,
          type: 'spring'
        },
        options: {
          isVisible: isNavOpen,
          shouldAnimate: !isDefaultResponsiveView
        }
      })}
      className="nav-popup-wrapper"
    >
      <div
        className="nav-popup"
        ref={ref}
        data-testid="stream-session-dropdown"
      >
        {streamSessions?.length ? (
          <>
            {groupStreamSessions(streamSessions).map(
              ({ groupLabel, sessionData }) => (
                <div
                  className="session-group"
                  key={groupLabel.replace(/\s+/g, '-').toLowerCase()}
                >
                  <h4>{groupLabel}</h4>
                  {sessionData.map((streamSession, i) => (
                    <StreamSessionButton
                      key={streamSession.streamId}
                      streamSession={streamSession}
                      handleSessionClick={handleSessionClick}
                    />
                  ))}
                </div>
              )
            )}
            {canLoadMoreStreamSessions && (
              <Button
                className="load-more-button"
                isLoading={isLoadingNextStreamSessionsPage}
                onClick={handleLoadMoreStreamSessions}
                ref={loadMoreSessionsBtnRef}
                variant="secondary"
              >
                {$content.load_more_sessions}
              </Button>
            )}
          </>
        ) : (
          <span className="no-streams" data-testid="no-streams">
            <b>{$content.no_stream_sessions}</b>
            <p>{$content.no_stream_sessions_message}</p>
          </span>
        )}
      </div>
    </m.div>
  );

  return isDefaultResponsiveView ? (
    renderPopup()
  ) : (
    <m.div
      {...createAnimationProps({
        animations: ['fadeIn-half'],
        options: {
          isVisible: isNavOpen
        }
      })}
      className="nav-popup-container"
    >
      {renderPopup()}
    </m.div>
  );
});

NavigatorPopup.defaultProps = { isNavOpen: false };

NavigatorPopup.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

export default NavigatorPopup;
