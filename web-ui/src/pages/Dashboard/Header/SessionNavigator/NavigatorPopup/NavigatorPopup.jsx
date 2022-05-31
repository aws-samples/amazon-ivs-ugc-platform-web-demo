import PropTypes from 'prop-types';
import { forwardRef, useEffect, useRef } from 'react';

import { dashboard as $dashboardContent } from '../../../../../content';
import { groupStreamSessions } from '../utils';
import { useStreams } from '../../../../../contexts/Streams';
import Button from '../../../../../components/Button';
import StreamSessionButton from './StreamSessionButton';
import useMobileOverlay from '../../../../../hooks/useMobileOverlay';
import withPortal from '../../../../../components/withPortal';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ toggleNavPopup }, ref) => {
  const loadMoreSessionsBtnRef = useRef();
  const {
    canLoadMoreStreamSessions,
    isLoadingNextStreamSessionsPage,
    streamSessions,
    updateActiveStreamSession,
    updateStreamSessionsList
  } = useStreams();

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

  useMobileOverlay();

  return (
    <div className="nav-popup-wrapper">
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
    </div>
  );
});

NavigatorPopup.propTypes = { toggleNavPopup: PropTypes.func.isRequired };

export default withPortal(NavigatorPopup, 'nav-popup');
