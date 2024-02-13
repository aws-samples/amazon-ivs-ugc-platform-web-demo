import React, { createContext, useState, useEffect, useRef } from 'react';
import useStage from '../hooks/useStage';
import useScreenshareStage from '../hooks/useScreenshareStage';

const defaultStageContext = {
    joinStage: undefined,
    participants: [],
    stageConnected: false,
};

const defaultScreenshareStageContext = {
    screenshareStage: undefined,
    joinScreenshareStage: undefined,
    screenshareStageConnected: false,
};

export const StageContext = createContext({
    ...defaultStageContext,
    ...defaultScreenshareStageContext,
});

export default function StageProvider({ children }) {
    const { joinStage, stageJoined, leaveStage, participants,localParticipant } = useStage();
    const { publishScreenshare, unpublishScreenshare, screenshareStageJoined } = useScreenshareStage();

    const state = {
        joinStage,
        stageJoined,
        leaveStage,
        participants,
        screenshareStageJoined,
        publishScreenshare,
        unpublishScreenshare,
        localParticipant
    };

    return <StageContext.Provider value={state}>{children}</StageContext.Provider>;
}
