import React, { useContext, useState } from 'react';
import Button from './Button.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice.jsx';
import Tooltip from '../../components/Tooltip/Tooltip.jsx';
import { MicOff, MicOn } from '../../assets/icons/index.js';
import { clsm } from '../../utils.js';
const { StreamType } = window.IVSBroadcastClient;

export default function MediaControls() {
    const { currentAudioDevice, currentVideoDevice } = useContext(LocalMediaContext);
    const { isTouchscreenDevice } = useResponsiveDevice();

    const [audioMuted, setAudioMuted] = useState(true);
    const [videoMuted, setVideoMuted] = useState(true);
    if (currentAudioDevice && audioMuted !== currentAudioDevice.isMuted) {
        setAudioMuted(currentAudioDevice.isMuted);
    }

    function toggleDeviceMute(device) {
        device.setMuted(!device.isMuted);
        if (device.streamType === StreamType.VIDEO) {
            setVideoMuted(device.isMuted);
        } else {
            setAudioMuted(device.isMuted);
        }
    }

    if (currentVideoDevice && videoMuted !== currentVideoDevice.isMuted) {
        setVideoMuted(currentVideoDevice.isMuted);
    }

    const ACTIVE_BUTTON_COLORS = [
        'bg-darkMode-blue',
        'dark:bg-darkMode-blue',
        'dark:hover:bg-darkMode-blue-hover',
        'focus:bg-darkMode-blue',
        'focus:dark:bg-darkMode-blue',
        'hover:bg-lightMode-blue-hover',
        '[&>svg]:fill-white'
      ];
      const INACTIVE_BUTTON_COLORS = [
        'bg-darkMode-red',
        'dark:bg-darkMode-red',
        'dark:hover:bg-darkMode-red-hover',
        'focus:bg-darkMode-red',
        'focus:dark:bg-darkMode-red',
        'hover:bg-lightMode-red-hover',
        '[&>svg]:fill-white'
      ];

    return (
        // <section className="container" style={{ paddingBottom: '3rem' }}>
        //     <div className="grid-cols-2 bg-slate-300">
        //         {/* <div className="column"> */}
        //             {/* <Button onClick={() => toggleDeviceMute(currentAudioDevice)}>
        //                 {audioMuted ? 'Unmute Mic' : 'Mute Mic'}
        //             </Button> */}
        //             <div>
        //             <Tooltip
        //             key={`wb-control-tooltip-mute-mic-tooltip`}
        //             position="above"
        //             translate={{ y: 2 }}
        //             message={audioMuted ? 'Unmute Mic' : 'Mute Mic'}
        //             >
        //                 <Button
        //                     ariaLabel={'Mute Mic'}
        //                     key={`wb-control-btn-mute-icon`}
        //                     // ref={withRef && ref}
        //                     variant="icon"
        //                     onClick={() => toggleDeviceMute(currentAudioDevice)}
        //                     isDisabled={false}
        //                     disableHover={isTouchscreenDevice}
        //                     className={clsm([
        //                     'w-11',
        //                     'h-11',
        //                     'dark:[&>svg]:fill-white',
        //                     '[&>svg]:fill-black',
        //                     'dark:bg-darkMode-gray-medium',
        //                     !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
        //                     'dark:focus:bg-darkMode-gray-medium',
        //                     'bg-lightMode-gray',
        //                         !audioMuted && [
        //                         INACTIVE_BUTTON_COLORS,
        //                         isTouchscreenDevice && [
        //                             'hover:bg-darkMode-red',
        //                             'dark:hover:dark:bg-darkMode-red'
        //                         ]
        //                         ],
        //                         audioMuted && [
        //                         ACTIVE_BUTTON_COLORS,
        //                         isTouchscreenDevice && [
        //                             'hover:bg-darkMode-blue',
        //                             'dark:hover:bg-darkMode-blue'
        //                         ]
        //                         ]
        //                     ])}
        //                 >
        //                     {audioMuted ? <MicOff /> : <MicOn />}
        //                 </Button>
        //             </Tooltip>
        //             </div>
                    
        //         {/* </div> */}
        //         <div>
        //             <Button onClick={() => toggleDeviceMute(currentVideoDevice)}>
        //                 {videoMuted ? 'Show Camera' : 'Hide Camera'}
        //             </Button>
        //         </div>
        //     </div>
        // </section>
        <>
            <div>
                <Tooltip
                key={`wb-control-tooltip-mute-mic-tooltip`}
                position="above"
                translate={{ y: 2 }}
                message={audioMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                    <Button
                        ariaLabel={'Mute Mic'}
                        key={`wb-control-btn-mute-icon`}
                        // ref={withRef && ref}
                        variant="icon"
                        onClick={() => toggleDeviceMute(currentAudioDevice)}
                        isDisabled={false}
                        disableHover={isTouchscreenDevice}
                        className={clsm([
                        'w-11',
                        'h-11',
                        'dark:[&>svg]:fill-white',
                        '[&>svg]:fill-black',
                        'dark:bg-darkMode-gray-medium',
                        !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                        'dark:focus:bg-darkMode-gray-medium',
                        'bg-lightMode-gray',
                            !audioMuted && [
                            INACTIVE_BUTTON_COLORS,
                            isTouchscreenDevice && [
                                'hover:bg-darkMode-red',
                                'dark:hover:dark:bg-darkMode-red'
                            ]
                            ],
                            audioMuted && [
                            ACTIVE_BUTTON_COLORS,
                            isTouchscreenDevice && [
                                'hover:bg-darkMode-blue',
                                'dark:hover:bg-darkMode-blue'
                            ]
                            ]
                        ])}
                    >
                        {audioMuted ? <MicOff /> : <MicOn />}
                    </Button>
                </Tooltip>
            </div>
            <div>
                <Button onClick={() => toggleDeviceMute(currentVideoDevice)}>
                    {videoMuted ? 'Show Camera' : 'Hide Camera'}
                </Button>
            </div>
        </>
    );
}
