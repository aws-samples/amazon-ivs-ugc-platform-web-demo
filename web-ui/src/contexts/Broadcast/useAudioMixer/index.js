import { useCallback } from 'react';

import { addAudioInputByDeviceId, addAudioInputByStream } from './utils';
import { client } from '../Broadcast';
import useMap from '../../../hooks/useMap';

const AUDIO_INPUT_TYPE = {
  MIC: 'MIC',
  SCREEN_SHARE: 'SCREEN_SHARE'
};
export const MICROPHONE_AUDIO_INPUT_NAME = 'microphone';
export const AUDIO_INPUT_NAME = 'audio';

const useAudioMixer = () => {
  const audioInputs = useMap();

  const isAudioInputMuted = useCallback(
    (audioInputName) => audioInputs.get(audioInputName)?.muted,
    [audioInputs]
  );

  const removeAudioInput = useCallback(
    (audioInputName) => {
      const device = client?.getAudioInputDevice(audioInputName);

      if (device) {
        for (const track of device.getAudioTracks()) track.stop();

        client.removeAudioInputDevice(audioInputName);
      }

      audioInputs.delete(audioInputName);
    },
    [audioInputs]
  );

  const addAudioInput = useCallback(
    async ({ name, data, type }) => {
      if (!name || !data || !type) return;

      const { muted = false, ...audioInputData } = data;

      /**
       * If an audio input with the same name has already been added,
       * remove it before replacing it with a new one
       */
      removeAudioInput(name);
      audioInputs.set(name, { ...audioInputData, muted, type });

      try {
        let stream;
        switch (type) {
          case AUDIO_INPUT_TYPE.MIC: {
            stream = await addAudioInputByDeviceId({
              name,
              data: audioInputData
            });
            break;
          }
          case AUDIO_INPUT_TYPE.SCREEN_SHARE: {
            stream = await addAudioInputByStream({
              name,
              data: audioInputData
            });
            break;
          }
          default: {
            console.error(`Unknown audio input type to add: ${type}`);

            return false;
          }
        }

        /**
         * If the audio input was muted during the time that it was being added to the broadcast
         * stream, then leave the audio track disabled. Otherwise, re-enable the audio track.
         */
        const [audioTrack] = stream?.getAudioTracks() || [];
        const audioInput = audioInputs.get(name);
        if (audioInput && audioTrack) audioTrack.enabled = !audioInput.muted;

        return true;
      } catch (error) {
        console.error(`Failed to add audio input: ${name}`, error);
        removeAudioInput(name);

        return false;
      }
    },
    [audioInputs, removeAudioInput]
  );

  const toggleMute = useCallback(
    (audioInputName, { shouldMute } = {}) => {
      if (!audioInputs.has(audioInputName)) return;

      const audioInput = audioInputs.get(audioInputName);
      const isMutedNext = shouldMute ?? !audioInput.muted;
      const stream = client.getAudioInputDevice(audioInputName);
      const [track] = stream.getAudioTracks();

      track.enabled = !isMutedNext;
      audioInputs.set(audioInputName, {
        ...audioInput,
        muted: isMutedNext
      });

      return isMutedNext;
    },
    [audioInputs]
  );

  const _addMicAudioInput = useCallback(
    (audioInputName, data) =>
      addAudioInput({
        data,
        name: audioInputName,
        type: AUDIO_INPUT_TYPE.MIC
      }),
    [addAudioInput]
  );
  const _addScreenShareAudioInput = useCallback(
    (audioInputName, data) =>
      addAudioInput({
        data,
        name: audioInputName,
        type: AUDIO_INPUT_TYPE.SCREEN_SHARE
      }),
    [addAudioInput]
  );

  return {
    addMicAudioInput: _addMicAudioInput,
    addScreenShareAudioInput: _addScreenShareAudioInput,
    toggleMute,
    removeAudioInput,
    isAudioInputMuted
  };
};

export default useAudioMixer;
