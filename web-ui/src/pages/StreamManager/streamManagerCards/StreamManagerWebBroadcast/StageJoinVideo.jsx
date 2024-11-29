import { useEffect, useRef } from 'react';

import { clsm } from '../../../../utils';
import { MicOff, VideoCameraOff } from '../../../../assets/icons';
import { useDeviceManager } from '../../../../contexts/DeviceManager';

const StageJoinVideo = () => {
  const videoRef = useRef();
  const {
    userMedia: { mediaStream, videoStopped, audioMuted, startUserMedia }
  } = useDeviceManager();

  useEffect(() => {
    if (mediaStream.active) return;

    (async function () {
      await startUserMedia();
    })();
  }, [startUserMedia, mediaStream]);

  useEffect(() => {
    if (!mediaStream || !videoRef.current) return;

    videoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  return (
    <div
      className={clsm([
        'flex',
        'aspect-video',
        '@container/video',
        'rounded-xl',
        'overflow-hidden',
        'justify-center'
      ])}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        className={clsm([
          'aspect-video',
          'col-span-full',
          'object-cover',
          'row-span-full',
          videoStopped ? 'hidden' : ['w-full', 'h-full']
        ])}
        playsInline
        aria-label="Local participant IVS stage video"
      >
        <track label="empty" kind="captions" srcLang="en" />
      </video>
      <div
        className={clsm([
          '@stage-video-lg/video:px-4',
          '@stage-video-lg/video:top-4',
          '@stage-video-xl/video:px-6',
          '@stage-video-xl/video:top-6',
          'absolute',
          'flex',
          'h-auto',
          'items-start',
          'justify-between',
          'px-3',
          'top-3',
          'w-full',
          'justify-end'
        ])}
      >
        {audioMuted && (
          <div
            className={clsm([
              'invisble',
              '[&>svg]:fill-white',
              'bg-modalOverlay',
              'flex',
              'items-center',
              'justify-center',
              'rounded-full',
              'h-6',
              'w-6',
              '[&>svg]:h-4',
              '[&>svg]:w-4',
              '@stage-video-sm/video:visible'
            ])}
          >
            <MicOff />
          </div>
        )}
      </div>
      <div
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray',
          '[&>svg]:fill-lightMode-gray-medium',
          'dark:[&>svg]:fill-darkMode-gray-light',
          'col-span-full',
          'fill-modalOverlay',
          'flex',
          'items-center',
          'justify-center',
          'row-span-full',
          'rounded',
          videoStopped ? ['w-full', 'h-full'] : 'hidden'
        ])}
      >
        <VideoCameraOff />
      </div>
    </div>
  );
};

export default StageJoinVideo;
