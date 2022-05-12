import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { dashboard as $dashboardContent } from '../../../../../content';
import { groupStreamSessions } from '../utils';
import { useStreams } from '../../../../../contexts/Streams';
import StreamSessionButton from './StreamSessionButton';
import withPortal from '../../../../../components/withPortal';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ toggleNavPopup }, ref) => {
  const { streamSessions, updateActiveSession } = useStreams();

  const handleSessionClick = (streamSession) => {
    updateActiveSession(streamSession);
    toggleNavPopup();
  };

  return (
    <div className="nav-popup" ref={ref}>
      {streamSessions.length ? (
        groupStreamSessions(streamSessions).map(
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
        )
      ) : (
        <span className="no-streams">
          <b>{$content.no_stream_sessions}</b>
          <p>{$content.no_stream_sessions_message}</p>
        </span>
      )}
    </div>
  );
});

NavigatorPopup.propTypes = { toggleNavPopup: PropTypes.func.isRequired };

export default withPortal(NavigatorPopup, 'nav-popup');
