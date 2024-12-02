import { useCallback, useRef } from 'react';
import { useBroadcast } from '../../../contexts/Broadcast';
import { CAMERA_LAYER_NAME } from '../../../contexts/Broadcast/useLayers';
import { useNotif } from '../../../contexts/Notification';
import { streamManager as $streamManagerContent } from '../../../content';
import { clsm } from '../../../utils';
import { MicOff, VideoCameraOff } from '../../../assets/icons';

const { mediaDevices } = navigator;
const $content = $streamManagerContent.stream_manager_web_broadcast;

const StageJoinVideo = () => {
  const { activeDevices, isCameraHidden, isMicrophoneMuted } = useBroadcast();
  const { notifyError } = useNotif();
  const mediaStream = useRef();
  const activeCameraDeviceId = activeDevices[CAMERA_LAYER_NAME]?.deviceId;

  const updateVideoMedia = useCallback(
    async (videoEl) => {
      if (!videoEl) {
        return;
      }

      const tracks = mediaStream.current?.getTracks() || [];
      tracks.forEach((track) => track.stop());

      if (!activeCameraDeviceId) {
        return;
      }

      try {
        mediaStream.current = await mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: activeCameraDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            aspectRatio: { ideal: 16 / 9 },
            facingMode: { ideal: 'user' },
            resizeMode: 'crop-and-scale'
          }
        });

        videoEl.srcObject = mediaStream.current;
      } catch (error) {
        console.error(error);
        notifyError($content.notifications.failed_to_access_camera);
      }
    },
    [activeCameraDeviceId, notifyError]
  );

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
        muted
        autoPlay
        ref={updateVideoMedia}
        className={clsm([
          'aspect-video',
          'col-span-full',
          'object-cover',
          'row-span-full',
          isCameraHidden ? 'hidden' : ['w-full', 'h-full']
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
        {isMicrophoneMuted && (
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
          isCameraHidden ? ['w-full', 'h-full'] : 'hidden'
        ])}
      >
        <VideoCameraOff />
      </div>
    </div>
  );
};

export default StageJoinVideo;
