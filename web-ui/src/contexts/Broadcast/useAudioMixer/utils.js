import { client } from '../Broadcast';

export const addAudioInputByDeviceId = async ({ name, data }) => {
  if (!name || !data) return;

  const { deviceId } = data;

  /**
   * Retrieve a MediaStream with an audio track constrained to the selected device ID.
   * Initially, the audio track is disabled. It is re-enabled once the audio input device
   * has been successfully added to the broadcast stream and the audio input has not been
   * muted during the process. If the audio input has been hidden after being added, it is
   * left disabled.
   */
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId }
  });

  if (client) {
    await client.addAudioInputDevice(stream, name);
  }

  return stream;
};

export const addAudioInputByStream = async ({ name, data }) => {
  if (!name || !data) return;

  const { stream } = data;

  await client.addAudioInputDevice(stream, name);

  return stream;
};
