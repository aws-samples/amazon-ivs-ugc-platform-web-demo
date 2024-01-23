import React from 'react';
import LocalMediaProvider from './contexts/LocalMediaContext.js';
import BroadcastProvider from './contexts/BroadcastContext.js';
import StageProvider from './contexts/StageContext.js';
import ClassroomApp from './ClassRoom.jsx';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { Provider as PollProvider } from '../../contexts/StreamManagerActions/Poll';
import { Provider as ChatProvider } from '../../contexts/Chat';
import { MediaCanvasProvider } from './hooks/useMediaCanvas.js';

function App() {
  return (
    <PollProvider>
      <NotificationProvider>
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
      </NotificationProvider>
    </PollProvider>
  );
}

export default App;
