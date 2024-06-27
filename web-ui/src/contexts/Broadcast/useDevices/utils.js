import { VIDEO_LAYER_NAME } from '../useLayers';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../useAudioMixer';

const { permissions, mediaDevices } = navigator;

/**
 * Request permission to access the user’s camera and microphone.
 */
export const requestMediaPermissions = async ({
  onPermissionsGranted,
  onPermissionsDenied
}) => {
  let err, mediaStream, mediaPermissions;
  try {
    if (!mediaDevices)
      throw new Error(
        'Media device permissions can only be requested in a secure context (i.e. HTTPS).'
      );

    const [
      { value: { state: cameraPermissionState = 'prompt' } = {} },
      { value: { state: microphonePermissionState = 'prompt' } = {} }
    ] = await Promise.allSettled(
      ['camera', 'microphone'].map((permissionDescriptorName) =>
        permissions.query({ name: permissionDescriptorName })
      )
    );

    const constraints = {};
    if (cameraPermissionState !== 'granted') constraints.video = true;
    if (microphonePermissionState !== 'granted') constraints.audio = true;

    if (Object.keys(constraints).length)
      mediaStream = await mediaDevices.getUserMedia(constraints);

    mediaPermissions = { audio: true, video: true };
  } catch (error) {
    mediaPermissions = { audio: false, video: false };
    err = error;
  } finally {
    const permValues = Object.values(mediaPermissions);
    const arePermissionsGranted = permValues.every((perm) => !!perm);

    if (arePermissionsGranted) {
      /**
       * onPermissionsGranted is used to enumerate the available media devices upon obtaining
       * permission to use the respective media inputs. The media device info labels retrieved
       * from navigator.mediaDevices.enumerateDevices() are only available during active
       * MediaStream use, or when persistent permissions have been granted.
       *
       * On Firefox in particular, the media info labels are set to an empty string in the case
       * where there is no active MediaStream, even if the application has previously temporarily
       * authorized access to the media devices by calling navigator.mediaDevices.getUserMedia().
       *
       * As a result, onPermissionSuccess must be called prior to stopping the media tracks to
       * ensure that we can reliably access the media device info labels across all browsers.
       */
      await onPermissionsGranted?.(mediaPermissions);

      const tracks = mediaStream?.getTracks() || [];
      for (const track of tracks) track.stop();
    } else onPermissionsDenied?.(err);
  }
};

/**
 * Retrieve a list of the available video and audio devices.
 *
 * The list of returned devices will omit any devices for which
 * the corresponding permission has not been granted.
 */
export const getMediaDevices = async () => {
  try {
    if (!mediaDevices)
      throw new Error(
        'Media devices can only be enumerated in a secure context (i.e. HTTPS).'
      );

    const devices = await mediaDevices.enumerateDevices();
    const videoInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'videoinput'
    );
    const audioInputDevices = devices.filter(
      ({ deviceId, kind }) => deviceId && kind === 'audioinput'
    );

    return {
      [VIDEO_LAYER_NAME]: videoInputDevices,
      [MICROPHONE_AUDIO_INPUT_NAME]: audioInputDevices
    };
  } catch (error) {
    console.error(error);

    return {
      [VIDEO_LAYER_NAME]: [],
      [MICROPHONE_AUDIO_INPUT_NAME]: []
    };
  }
};
