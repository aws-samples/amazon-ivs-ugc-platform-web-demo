import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDisplayMedia, stopMediaStream } from './helpers';

let mediaStream;
let isScreenShareDialogOpen = false;

/**
 * Creates and manages a single display media stream
 */
function useDisplayMedia() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [displayMediaError, setDisplayMediaError] = useState();
  const [mediaStreamToPublish, setMediaStreamToPublish] = useState(null);
  const [shouldUnpublishScreenshare, setShouldUnpublishScreenshare] =
    useState(false);

  const stopScreenShare = useCallback(() => {
    setShouldUnpublishScreenshare(true);
    stopMediaStream(mediaStream);
    mediaStream = undefined;

    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    if (isScreenShareDialogOpen) return;

    stopScreenShare();
    setDisplayMediaError(undefined);

    let cancelled = false;
    try {
      isScreenShareDialogOpen = true;
      mediaStream = await getDisplayMedia();
    } catch (error) {
      /**
       * In Chrome only, a "Permission denied" DOMException indicates that
       * the user cancelled the screen-share request from the window prompt
       * without explicitly denying permissions.
       */
      cancelled =
        error instanceof DOMException && error.message === 'Permission denied';
    } finally {
      isScreenShareDialogOpen = false;
    }

    if (!mediaStream) {
      if (!cancelled) {
        setDisplayMediaError('permissionsDenied');
      }

      return;
    }

    setIsScreenSharing(true);
    setMediaStreamToPublish(mediaStream);
  }, [stopScreenShare, setMediaStreamToPublish]);

  useEffect(() => {
    const screenCaptureTrack = mediaStream?.getVideoTracks()[0];
    screenCaptureTrack?.addEventListener('ended', stopScreenShare);

    return () => {
      screenCaptureTrack?.removeEventListener('ended', stopScreenShare);
    };
  }, [isScreenSharing, stopScreenShare]);

  useEffect(() => stopScreenShare, [stopScreenShare]);

  return useMemo(
    () => ({
      isScreenSharing,
      startScreenShare,
      stopScreenShare,
      displayMediaError,
      mediaStreamToPublish,
      setMediaStreamToPublish,
      shouldUnpublishScreenshare,
      setShouldUnpublishScreenshare
    }),
    [
      isScreenSharing,
      startScreenShare,
      stopScreenShare,
      displayMediaError,
      mediaStreamToPublish,
      setMediaStreamToPublish,
      shouldUnpublishScreenshare,
      setShouldUnpublishScreenshare
    ]
  );
}

export default useDisplayMedia;
