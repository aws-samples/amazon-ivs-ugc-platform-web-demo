import PropTypes from 'prop-types';
import { forwardRef, useEffect, useRef } from 'react';
import { m } from 'framer-motion';

import { dashboard as $dashboardContent } from '../../../../content';
import { groupStreamSessions } from '../utils';
import { useMobileBreakpoint } from '../../../../contexts/MobileBreakpoint';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import StreamSessionButton from './StreamSessionButton';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ isNavOpen, toggleNavPopup }, ref) => {
  const {
    canLoadMoreStreamSessions,
    isLoadingNextStreamSessionsPage,
    streamSessions,
    updateActiveStreamSession,
    updateStreamSessionsList
  } = useStreams();
  const { isMobileView } = useMobileBreakpoint();
  const loadMoreSessionsBtnRef = useRef();

  const handleSessionClick = (streamSession) => {
    updateActiveStreamSession(streamSession);
    toggleNavPopup();
  };

  const handleLoadMoreStreamSessions = () => {
    updateStreamSessionsList(true);
  };

  useEffect(() => {
    if (!isLoadingNextStreamSessionsPage) {
      loadMoreSessionsBtnRef.current?.blur();
    }
  }, [isLoadingNextStreamSessionsPage]);

  const renderPopup = () => (
    <m.div
      initial="hidden"
      animate={isNavOpen ? 'visible' : 'hidden'}
      exit="hidden"
      variants={!isMobileView && { hidden: { y: '-102%' }, visible: { y: 0 } }}
      transition={{
        damping: 25,
        duration: 0.25,
        stiffness: 250,
        type: 'spring'
      }}
      className="nav-popup-wrapper"
    >
      <div className="nav-popup" ref={ref}>
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
          <span className="no-streams">
            <b>{$content.no_stream_sessions}</b>
            <p>{$content.no_stream_sessions_message}</p>
          </span>
        )}
      </div>
    </m.div>
  );

  return isMobileView ? (
    renderPopup()
  ) : (
    <m.div
      initial="hidden"
      animate={isNavOpen ? 'visible' : 'hidden'}
      exit="hidden"
      variants={
        !isMobileView && { hidden: { opacity: 0 }, visible: { opacity: 1 } }
      }
      transition={{ duration: 0.25, type: 'tween' }}
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
