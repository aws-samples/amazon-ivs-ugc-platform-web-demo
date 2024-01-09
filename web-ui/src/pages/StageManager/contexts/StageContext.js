import React, { createContext, useState, useEffect, useRef } from 'react';
import useStage from '../hooks/useStage';
import useScreenshareStage from '../hooks/useScreenshareStage';

const defaultStageContext = {
    joinStage: undefined,
    participants: [],
    stageConnected: false,
    stageInfo: {},
    handleSetStageInfo: undefined
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
    const { joinStage, stageJoined, leaveStage, participants, stageInfo, handleSetStageInfo } = useStage();
    const { publishScreenshare, unpublishScreenshare, screenshareStageJoined } = useScreenshareStage();

    const state = {
        joinStage,
        stageJoined,
        leaveStage,
        participants,
        screenshareStageJoined,
        publishScreenshare,
        unpublishScreenshare,
        stageInfo,
        handleSetStageInfo
    };

    return <StageContext.Provider value={state}>{children}</StageContext.Provider>;
}
