import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDisplayMedia, stopMediaStream } from './helpers';
import { useDispatch } from 'react-redux';
import { updateDisplayMediaStates } from '../../reducers/streamManager';

let mediaStream, screenCaptureTrack;
let isScreenShareDialogOpen = false;

/**
 * Creates and manages a single display media stream
 */
function useDisplayMedia() {
  const dispatch = useDispatch();
  const [displayMediaError, setDisplayMediaError] = useState();
  const [mediaStreamToPublish, setMediaStreamToPublish] = useState(null);

  const stopScreenShare = useCallback(() => {
    if (!mediaStream) return;

    dispatch(
      updateDisplayMediaStates({
        shouldUnpublish: true,
        isScreenSharing: false
      })
    );
    stopMediaStream(mediaStream);
    mediaStream = undefined;
  }, [dispatch]);

  const startScreenShare = useCallback(async () => {
    if (isScreenShareDialogOpen) return;

    setDisplayMediaError(undefined);

    let cancelled = false;
    try {
      isScreenShareDialogOpen = true;
      mediaStream = await getDisplayMedia();

      screenCaptureTrack = mediaStream.getVideoTracks()[0];
      screenCaptureTrack?.addEventListener('ended', stopScreenShare);
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
      dispatch(updateDisplayMediaStates({ isScreenSharing: false }));

      return;
    }

    setMediaStreamToPublish(mediaStream);
  }, [stopScreenShare, dispatch]);

  useEffect(() => {
    return () => {
      screenCaptureTrack?.removeEventListener('ended', stopScreenShare);
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return useMemo(
    () => ({
      startScreenShare,
      stopScreenShare,
      displayMediaError,
      mediaStreamToPublish,
      setMediaStreamToPublish
    }),
    [
      startScreenShare,
      stopScreenShare,
      displayMediaError,
      mediaStreamToPublish,
      setMediaStreamToPublish
    ]
  );
}

export default useDisplayMedia;
