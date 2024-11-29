import { isFulfilled, isRejected, noop } from '../utils';

import { DEVICE_KIND } from '../constants';

const { permissions, mediaDevices } = navigator;

function checkMediaDevicesSupport() {
  if (!mediaDevices) {
    throw new Error(
      'Media device permissions can only be requested in a secure context (i.e. HTTPS).'
    );
  }
}

function stopMediaStream(mediaStream) {
  const tracks = mediaStream?.getTracks() || [];
  for (const track of tracks) {
    track.stop();
  }
}

async function requestUserMediaPermissions({
  onPermissionsGranted = noop,
  onPermissionsDenied = noop,
  deviceIds = {}
}) {
  let error;
  let mediaStream;
  let arePermissionsGranted = false;

  try {
    checkMediaDevicesSupport();

    const [cameraPermissionQueryResult, microphonePermissionQueryResult] =
      await Promise.allSettled(
        ['camera', 'microphone'].map((permissionDescriptorName) =>
          permissions.query({
            name: permissionDescriptorName
          })
        )
      );

    const constraints = {};

    if (
      (isFulfilled(cameraPermissionQueryResult) &&
        cameraPermissionQueryResult.value.state !== 'granted') ||
      isRejected(cameraPermissionQueryResult)
    ) {
      constraints.video = {
        deviceId: { ideal: deviceIds.video || 'default' }
      };
    }

    if (
      (isFulfilled(microphonePermissionQueryResult) &&
        microphonePermissionQueryResult.value.state !== 'granted') ||
      isRejected(microphonePermissionQueryResult)
    ) {
      constraints.audio = {
        deviceId: { ideal: deviceIds.audio || 'default' }
      };
    }

    if (Object.keys(constraints).length) {
      mediaStream = await mediaDevices.getUserMedia(constraints);
    }

    arePermissionsGranted = true;
  } catch (e) {
    console.error(e);
    error = new Error(e.name); // NotAllowedError + NotFoundError
  }

  if (arePermissionsGranted) {
    /**
     * onPermissionsGranted is used to enumerate the available media devices upon obtaining
     * permissions to use the respective media inputs. The media device info labels retrieved
     * from navigator.mediaDevices.enumerateDevices() are only available during active
     * MediaStream use, or when persistent permissions have been granted.
     *
     * On Firefox in particular, the media info labels are set to an empty string when there
     * is no active MediaStream, even if the application had previously authorized temporary
     * access to the media devices by calling navigator.mediaDevices.getUserMedia().
     *
     * As a result, onPermissionSuccess must be called prior to stopping the media tracks to
     * ensure that we can reliably access the media device info labels across all browsers.
     */
    await onPermissionsGranted(mediaStream);
    stopMediaStream(mediaStream);
  } else {
    onPermissionsDenied(error);
  }

  return arePermissionsGranted;
}

async function enumerateDevices() {
  try {
    checkMediaDevicesSupport();

    const devices = await mediaDevices.enumerateDevices();

    const videoInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'videoinput'
    );
    const audioInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'audioinput'
    );

    return { video: videoInputDevices, audio: audioInputDevices };
  } catch (error) {
    console.error(error);

    return { video: [], audio: [] };
  }
}

function getUserMedia({ audioDeviceId, videoDeviceId }) {
  if (!audioDeviceId && !videoDeviceId) {
    return;
  }

  checkMediaDevicesSupport();

  const constraints = {};

  if (videoDeviceId) {
    constraints.video = {
      deviceId: { exact: videoDeviceId }, // https://bugzilla.mozilla.org/show_bug.cgi?id=1443294#c7
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 30 },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: { ideal: 'user' },
      resizeMode: 'crop-and-scale'
    };
  }

  if (audioDeviceId) {
    constraints.audio = {
      deviceId: { exact: audioDeviceId }
    };
  }

  return mediaDevices.getUserMedia(constraints);
}

function getDisplayMedia() {
  checkMediaDevicesSupport();

  const options = {
    video: {
      cursor: 'always',
      resizeMode: 'crop-and-scale'
    },
    audio: {
      // The following audio constraints disable all browser audio processing
      // to prevent potential audio quality and low volume issues when screen
      // sharing tab audio.
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false
    },
    // https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
    systemAudio: 'include',
    preferCurrentTab: false
  };

  return mediaDevices.getDisplayMedia(options);
}

function updateMediaStreamTracks(mediaStream, tracks = []) {
  for (const track of tracks) {
    let localTrack;

    if (track.kind === DEVICE_KIND.AUDIO) {
      [localTrack] = mediaStream.getAudioTracks();
    } else if (track.kind === DEVICE_KIND.VIDEO) {
      [localTrack] = mediaStream.getVideoTracks();
    }

    if (localTrack?.id !== track.id) {
      if (localTrack) {
        track.enabled = localTrack.enabled;
        mediaStream.removeTrack(localTrack);
        localTrack.stop();
      }

      mediaStream.addTrack(track);
    }
  }
}

function createMirroredMediaStream(mediaStream) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const [videoTrack] = mediaStream.getVideoTracks();
  const [audioTrack] = mediaStream.getAudioTracks();

  if (!videoTrack) {
    return mediaStream;
  }

  const mirroredMediaStream = canvas.captureStream(30);
  const [mirroredVideoTrack] = mirroredMediaStream.getVideoTracks();
  mirroredMediaStream.addTrack(audioTrack);

  function drawOnCanvas(frame, width, height) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(-1, 0, 0, 1, width, 0);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frame, 0, 0);
  }

  if ('MediaStreamTrackProcessor' in window) {
    const processor = new window.MediaStreamTrackProcessor(videoTrack); // eslint-disable-line @typescript-eslint/no-explicit-any
    const reader = processor.readable.getReader();

    (async function readChunk() {
      const { done, value } = await reader.read();

      if (done || mirroredVideoTrack.readyState === 'ended') {
        videoTrack.stop(); // stop the source video track
        value.close();
        await reader.cancel();

        return;
      }

      drawOnCanvas(value, value.displayWidth, value.displayHeight);
      value.close();
      readChunk();
    })();
  } else {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.muted = true;

    const scheduler = video.requestVideoFrameCallback
      ? (callback) => video.requestVideoFrameCallback(callback)
      : requestAnimationFrame;

    (function draw() {
      if (mirroredVideoTrack.readyState === 'ended') {
        videoTrack.stop(); // stop the source video track
        video.srcObject = null;

        return;
      }

      drawOnCanvas(video, video.videoWidth, video.videoHeight);
      scheduler(draw);
    })();
  }

  return mirroredMediaStream;
}

export {
  createMirroredMediaStream,
  enumerateDevices,
  getDisplayMedia,
  getUserMedia,
  requestUserMediaPermissions,
  stopMediaStream,
  updateMediaStreamTracks
};
