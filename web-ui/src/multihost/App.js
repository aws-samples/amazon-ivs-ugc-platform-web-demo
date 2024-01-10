import React from 'react';
import LocalMedia from './components/LocalMedia.js';
import LocalMediaProvider from './contexts/LocalMediaContext.js';
import BroadcastProvider from './contexts/BroadcastContext.js';
import StageProvider from './contexts/StageContext.js';
import StageParticipants from './components/StageParticipants.js';
function App() {
    return (
        <LocalMediaProvider>
            <BroadcastProvider>
                <StageProvider>
                    <div className="content container">
                        <LocalMedia />
                        <StageParticipants />
                    </div>
                </StageProvider>
            </BroadcastProvider>
        </LocalMediaProvider>
    );
}

export default App;