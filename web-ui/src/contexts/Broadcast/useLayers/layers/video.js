import { client } from '../../Broadcast';
import { isiOS, retryWithExponentialBackoff } from '../../../../utils';

const { mediaDevices } = navigator;

export const addVideoLayerByDeviceId = async ({ name, data }) => {
  if (!name || !data || !client) return;

  const { deviceId, position = { index: 0 } } = data;
  const {
    maxResolution: { width: maxWidth, height: maxHeight },
    maxFramerate
  } = client.config.streamConfig;

  /**
   * Retrieve a MediaStream with a video track constrained to the selected device ID.
   * If videoTrackEnabled is false, the video track is disabled before being added to
   * the broadcast stream. This is useful for situations when some pre-condition is
   * must be met prior to the video layer being re-enabled once the input device
   * has been successfully added to the broadcast stream.
   *
   * On iOS, an error is sometimes thrown by the initial call to getUserMedia,
   * containing the following message:
   *
   *  > Failed to create MediaStream video source: Request is not allowed
   *
   * However, subsequent calls to getUserMedia have been shown to succeed.
   * Therefore, we use retryWithExponentialBackoff to handle this behavior by
   * retrying the call to getUserMedia in the case that it throws an error.
   *
   */
  const stream = await retryWithExponentialBackoff({
    promiseFn: () =>
      mediaDevices?.getUserMedia({
        video: {
          deviceId,
          ...(!isiOS() && {
            width: { ideal: maxWidth, max: maxWidth },
            height: { ideal: maxHeight, max: maxHeight }
          }),
          frameRate: { ideal: maxFramerate },
          aspectRatio: { ideal: 16 / 9 },
          resizeMode: 'crop-and-scale'
        }
      }),
    maxRetries: 2
  });

  return client.addVideoInputDevice(stream, name, position);
};

export const addVideoLayerByStream = ({ name, data }) => {
  if (!name || !data) return;

  const { stream, position = { index: 0 } } = data;

  return client.addVideoInputDevice(stream, name, position);
};
