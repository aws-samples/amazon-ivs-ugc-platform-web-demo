import React, { useState, useRef, useEffect, useContext, useReducer } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
const { create, BASIC_FULL_HD_LANDSCAPE, StreamType } = window.IVSBroadcastClient;

const layouts = {
    1: { 1: { height: 475, width: 840, x: 211, y: 118 } },
    2: { 1: { height: 323, width: 567, x: 50, y: 194 }, 2: { height: 323, width: 567, x: 660, y: 194 } },
    3: {
        1: { height: 303, width: 567, x: 50, y: 50 },
        2: { height: 303, width: 567, x: 660, y: 50 },
        3: { height: 303, width: 567, x: 349, y: 369 },
    },
    4: {
        1: { height: 303, width: 567, x: 50, y: 50 },
        2: { height: 303, width: 567, x: 660, y: 50 },
        3: { height: 303, width: 567, x: 50, y: 369 },
        4: { height: 303, width: 567, x: 660, y: 369 },
    },
    5: {
        1: { height: 212, width: 378, x: 50, y: 143 },
        2: { height: 212, width: 378, x: 444, y: 143 },
        3: { height: 212, width: 378, x: 856, y: 143 },
        4: { height: 212, width: 378, x: 221, y: 389 },
        5: { height: 212, width: 378, x: 632, y: 389 },
    },
    6: {
        1: { height: 212, width: 378, x: 50, y: 143 },
        2: { height: 212, width: 378, x: 444, y: 143 },
        3: { height: 212, width: 378, x: 856, y: 143 },
        4: { height: 212, width: 378, x: 50, y: 389 },
        5: { height: 212, width: 378, x: 444, y: 389 },
        6: { height: 212, width: 378, x: 856, y: 389 },
    },
};

const BROADCAST_CONFIG = {
    maxResolution: {
        width: 1280, // Note: flip width and height values if portrait is desired
        height: 720,
    },
    maxFramerate: 30,
    maxBitrate: 2500,
};

const Actions = {
    // set the ingest endpoint and make the client
    INIT: 'init',
    ADD_STREAM: 'addStream',
    REMOVE_STREAM: 'removeStream',
    START: 'start',
    STOP: 'stop',
    UPDATE_STREAM_KEY: 'updateStreamKey',
};

function calculateTotalVideos(participants) {
    let videos = 0;
    for (let [id, streams] of participants) {
        const hasVideo = streams.find((stream) => stream.streamType === StreamType.VIDEO);
        if (hasVideo) {
            videos++;
        }
    }
    return videos;
}

function addStreamsToState(state, streamsToAdd) {
    let newState = state;
    let newStreams = [];
    let hasVideo = false;

    streamsToAdd.forEach((stream) => {
        if (stream.streamType === StreamType.AUDIO) {
            const trackExists = newState.audioStreams.find((existingStream) => existingStream.id === stream.id);
            if (!trackExists) {
                newState.audioStreams.push(stream);
                newStreams.push(stream);
            }
        } else {
            const trackExists = newState.videoStreams.find((existingStream) => existingStream.id === stream.id);
            // only add the video if it doesnt exist and we have less than 6 videos
            if (!trackExists && newState.videoStreams.length < 6) {
                newState.videoStreams.push(stream);
                newStreams.push(stream);
                hasVideo = true;
            }
        }
    });

    if (hasVideo) {
        if (newState.broadcastClient) {
            updateLayout(newState.broadcastClient, newState.videoStreams);
        }
    }

    if (newState.broadcastClient) {
        for (const stream of newStreams) {
            if (stream.streamType === StreamType.AUDIO) {
                addAudioStreamToClient(newState.broadcastClient, stream);
            } else {
                addVideoStreamToClient(newState.broadcastClient, stream, newState.videoStreams.length);
            }
        }
    }

    return newState;
}

function removeStreamsFromState(state, streamsToRemove) {
    console.log('removing streams', streamsToRemove);

    let removedVideo = false;
    let newState = state;
    const removedStreams = [];

    streamsToRemove.forEach((stream) => {
        if (stream.streamType === StreamType.AUDIO) {
            newState.audioStreams = newState.audioStreams.filter((existingStream) => {
                if (existingStream.id === stream.id) {
                    removedStreams.push(stream);
                    return false;
                } else {
                    return true;
                }
            });
        } else {
            newState.videoStreams = newState.videoStreams.filter((existingStream) => {
                if (existingStream.id === stream.id) {
                    removedStreams.push(stream);
                    removedVideo = true;
                    return false;
                } else {
                    return true;
                }
            });
        }
    });

    if (newState.broadcastClient) {
        for (const stream of removedStreams) {
            if (stream.streamType === StreamType.AUDIO) {
                try {
                    newState.broadcastClient.removeAudioInputDevice(stream.id);
                    console.log('removed audio stream', stream.id);
                } catch (err) {
                    console.warn('error removing device', err);
                }
            } else {
                try {
                    newState.broadcastClient.removeVideoInputDevice(stream.id);
                    console.log('removed video stream', stream.id);
                } catch (err) {
                    console.warn('error removing device', err);
                }
            }
        }
    }

    if (removedVideo) {
        if (newState.broadcastClient) {
            updateLayout(newState.broadcastClient, newState.videoStreams);
        }
    }
    return newState;
}

// function to add any participants that joined before we created the broadcast client
function addCurrentParticipants(state) {
    const layout = layouts[state.videoStreams.length];
    console.log("layout",layout,state.videoStreams.length)
    for (let audioStream of state.audioStreams) {
        state.broadcastClient
            .addAudioInputDevice(new MediaStream([audioStream.mediaStreamTrack]), audioStream.id)
            .catch((err) => console.error('error adding audio stream', err));
    }
    let idx = 1;
    for (let videoStream of state.videoStreams) {
        const videoLayout = layout[idx];
    console.log("layout",layout,state.videoStreams.length)

        state.broadcastClient
            .addVideoInputDevice(new MediaStream([videoStream.mediaStreamTrack]), videoStream.id, {
                ...videoLayout,
                index: idx,
            })
            .catch((err) => console.error('error adding video stream', err));
        idx++;
    }
}

function updateLayout(client, videos) {
    if (videos.length > 6) {
        console.warn('unsupported layout', videos.length);
        return;
    }
    console.log('updating layout', videos.length);
    const newLayout = layouts[videos.length];
    let idx = 1;
    for (let video of videos) {
        const participantLayout = newLayout[idx];
        console.log('updating video', video.id, idx, participantLayout, newLayout);
        client.updateVideoDeviceComposition(video.id, { ...participantLayout, index: idx });
        idx++;
    }
}

function addAudioStreamToClient(client, stream) {
    if (!stream) {
        return;
    }
    console.log('adding audio stream');
    client
        .addAudioInputDevice(new MediaStream([stream.mediaStreamTrack]), stream.id)
        .catch((err) => console.error('error adding audio device', err));
}

function addVideoStreamToClient(client, stream, totalVideos) {
    if (!stream) {
        return;
    }
    console.log('adding video stream');
    const participantLayout = layouts[totalVideos][totalVideos];
    client
        .addVideoInputDevice(new MediaStream([stream.mediaStreamTrack]), stream.id, {
            ...participantLayout,
            index: totalVideos,
        })
        .catch((err) => console.error('error adding video stream', err));
}

function reducer(state, action) {
    switch (action.type) {
        case Actions.INIT:
            console.log('INIT');
            if (state.broadcastStarted) {
                console.warn('cannot update ingest endpoint while broadcasting');
                return state;
            }

            try {
                const broadcastClient = create({
                    streamConfig: BROADCAST_CONFIG,
                    ingestEndpoint: action.ingestEndpoint,
                });
                sessionStorage.setItem('ingest-endpoint', action.ingestEndpoint);

                const newState = {
                    ...state,
                    broadcastClient,
                    createError: undefined,
                    ingestEndpoint: action.ingestEndpoint,
                };

                if (newState.videoStreams.length > 0) {
                    addCurrentParticipants(newState);
                }

                return newState;
            } catch (err) {
                return {
                    ...state,
                    createError: err,
                };
            }

        case Actions.ADD_STREAM:
            const { streams: streamsToAdd } = action;
            return addStreamsToState(state, streamsToAdd);

        case Actions.REMOVE_STREAM:
            const { streams: streamsToRemove } = action;
            return removeStreamsFromState(state, streamsToRemove);

        case Actions.START:
            return { ...state, broadcastStarted: true };

        case Actions.STOP:
            return { ...state, broadcastStarted: false };

        case Actions.UPDATE_STREAM_KEY:
            if (state.broadcastStarted) {
                console.warn('cannot update stream key while broadcasting');
                return state;
            }
            sessionStorage.setItem('stream-key', action.streamKey);
            return { ...state, streamKey: action.streamKey };

        default:
            console.warn('unknown action', action);
            return state;
    }
}

const initialState = {
    createError: undefined,
    // the endpoint for the broadcast
    ingestEndpoint: undefined,
    // the streamkey for the broadcast
    streamKey: undefined,
    // the IVSBroadcastClient
    broadcastClient: undefined,
    // are we currently broadcasting
    broadcastStarted: false,
    // list of all video streams for the broadcast
    videoStreams: [],
    // list of all audio streams for the broadcast
    audioStreams: [],
};

export default function useBroadcast() {
    const cachedIngestEndpoint = sessionStorage.getItem('ingest-endpoint');
    const cachedStreamKey = sessionStorage.getItem('stream-key');

    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        ingestEndpoint: cachedIngestEndpoint,
        streamKey: cachedStreamKey,
        broadcastClient: cachedIngestEndpoint
            ? create({
                  streamConfig: BROADCAST_CONFIG,
                  ingestEndpoint: cachedIngestEndpoint,
              })
            : undefined,
    });

    const init = (ingestEndpoint) => {
        if (ingestEndpoint !== '') {
            dispatch({ type: Actions.INIT, ingestEndpoint });
        }
    };

    const startBroadcast = async () => {
        if (state.createError) {
            console.error('Error creating broadcastClient', state.createError);
            alert('There was an error creating the broadcast client. Please check you have a valid ingest endpoint');
            return;
        }
        if (!state.broadcastClient) {
            alert('Cannot start broadcast without a ingest endpoint');
            return;
        }
        if (!state.streamKey) {
            alert('Cannot start broadcast without a stream key');
            return;
        }
        try {
            await state.broadcastClient.startBroadcast(state.streamKey);
            dispatch({ type: Actions.START });
        } catch (err) {
            console.error('error starting broadcast', err);
        }
    };

    const stopBroadcast = () => {
        if (!state.broadcastClient) {
            alert('Cannot stop a broadcast that doesnt exist');
            return;
        }
        if (!state.broadcastStarted) {
            alert('Cannot stop a broadcast that isnt started');
            return;
        }
        try {
            state.broadcastClient.stopBroadcast();
            dispatch({ type: Actions.STOP });
        } catch (err) {
            console.error('error stopping broadcast', err);
        }
    };

    const addStream = (participantId, streams) => {
        dispatch({ type: Actions.ADD_STREAM, participantId, streams });
    };

    const removeStream = (participantId, streams) => {
        dispatch({ type: Actions.REMOVE_STREAM, participantId, streams });
    };

    const updateStreamKey = (streamKey) => {
        if (streamKey !== '') {
            dispatch({ type: Actions.UPDATE_STREAM_KEY, streamKey });
        }
    };

    return {
        init,
        startBroadcast,
        stopBroadcast,
        addStream,
        removeStream,
        updateStreamKey,
        broadcastStarted: state.broadcastStarted,
        broadcastClient: state.broadcastClient,
    };
}
