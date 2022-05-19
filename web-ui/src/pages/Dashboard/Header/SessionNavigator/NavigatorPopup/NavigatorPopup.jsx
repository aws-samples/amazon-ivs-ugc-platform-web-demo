import PropTypes from 'prop-types';
import { forwardRef, useEffect } from 'react';

import { dashboard as $dashboardContent } from '../../../../../content';
import { groupStreamSessions } from '../utils';
import { useStreams } from '../../../../../contexts/Streams';
import { useMobileBreakpoint } from '../../../../../contexts/MobileBreakpoint';
import Button from '../../../../../components/Button';
import StreamSessionButton from './StreamSessionButton';
import withPortal from '../../../../../components/withPortal';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ toggleNavPopup }, ref) => {
  const { isMobileView } = useMobileBreakpoint();
  const {
    canLoadMoreStreamSessions,
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
    if (isMobileView) {
      document.body.style.overflow = 'hidden';
    }

    return () => (document.body.style.overflow = null);
  }, [isMobileView]);

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
              <Button onClick={handleLoadMoreStreamSessions} variant="link">
                {$content.load_more}
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
