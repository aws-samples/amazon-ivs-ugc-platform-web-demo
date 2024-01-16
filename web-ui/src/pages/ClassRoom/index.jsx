import React from 'react';
import LocalMediaProvider from './contexts/LocalMediaContext.js';
import BroadcastProvider from './contexts/BroadcastContext.js';
import StageProvider from './contexts/StageContext.js';
import ClassroomApp from './ClassRoom.jsx';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { Provider as PollProvider } from '../../contexts/StreamManagerActions/Poll';
import { Provider as ChatProvider } from '../../contexts/Chat';
import { Provider as StreamManagerActionsProvider } from '../../contexts/StreamManagerActions';
import { Provider as StreamManagerWebBroadcastProvider } from '../../contexts/Broadcast';
import { useRef } from 'react';
import { useUser } from '../../contexts/User';
import { MediaCanvasProvider } from './hooks/useMediaCanvas.js';

function App() {
  const { userData } = useUser();
  const { ingestEndpoint, streamKeyValue: streamKey } = userData || {};
  const previewRef = useRef();

  return (
    <PollProvider>
      <NotificationProvider>
        {/* <StreamManagerWebBroadcastProvider
          previewRef={previewRef}
          ingestEndpoint={ingestEndpoint}
          streamKey={streamKey}
        > */}
        <ChatProvider>
          <LocalMediaProvider>
            <MediaCanvasProvider>
              <BroadcastProvider>
                <StageProvider>
                  <ClassroomApp />
                </StageProvider>
              </BroadcastProvider>
            </MediaCanvasProvider>
          </LocalMediaProvider>
        </ChatProvider>
        {/* </StreamManagerWebBroadcastProvider> */}
      </NotificationProvider>
    </PollProvider>
  );
}

export default App;
