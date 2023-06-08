const { mediaDevices } = navigator;

export const captureScreenShareStream = () =>
  mediaDevices?.getDisplayMedia({
    video: {
      cursor: 'always',
      resizeMode: 'crop-and-scale'
    },
    audio: {
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false
    },
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
    systemAudio: 'include',
    preferCurrentTab: false
  });
