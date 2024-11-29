import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import { noop } from '../../../../utils';
import { streamManager as $streamManagerContent } from '../../../../content';
import Dropdown from '../../../../components/Dropdown';
import { VIDEO_LAYER_NAME } from '../../../../contexts/Broadcast/useLayers';
import { AUDIO_INPUT_NAME } from '../../../../contexts/Broadcast/useAudioMixer';

const $content = $streamManagerContent.web_broadcast_audio_video_settings_modal;

const DeviceDropdown = ({
  deviceName = '',
  devicesList = [],
  activeDevices = {},
  updateActiveDevice = noop,
  videoStopped = false,
  audioMuted = false
}) => {
  const activeDevice = activeDevices[deviceName];
  const activeDeviceId = activeDevice?.deviceId ?? '';

  const placeholder = useMemo(
    () => `${$content.choose} ${deviceName.toLowerCase()}`,
    [deviceName]
  );
  const options = useMemo(
    () =>
      devicesList.map(({ deviceId, label }, index) => ({
        value: deviceId,
        label: label || `${deviceName} ${index + 1}`
      })),
    [deviceName, devicesList]
  );

  const [label, updateActiveDeviceOptions] = useMemo(() => {
    let label, updateActiveDeviceOptions;
    if (deviceName === VIDEO_LAYER_NAME || deviceName === 'video') {
      label = $content.camera;
      updateActiveDeviceOptions = { hidden: videoStopped };
    }
    if (deviceName === AUDIO_INPUT_NAME || deviceName === 'audio') {
      label = $content.microphone;
      updateActiveDeviceOptions = { muted: audioMuted };
    }

    return [label, updateActiveDeviceOptions];
  }, [audioMuted, deviceName, videoStopped]);

  const onChange = useCallback(
    (e) => {
      const selectedDeviceId = e.target.value;
      const device = devicesList?.find(
        ({ deviceId }) => selectedDeviceId === deviceId
      );
      if (activeDeviceId !== selectedDeviceId)
        updateActiveDevice(deviceName, device, updateActiveDeviceOptions);
    },
    [
      activeDeviceId,
      deviceName,
      devicesList,
      updateActiveDevice,
      updateActiveDeviceOptions
    ]
  );

  return (
    <Dropdown
      id={deviceName}
      label={label}
      selected={activeDeviceId}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

DeviceDropdown.propTypes = {
  deviceName: PropTypes.string,
  devicesList: PropTypes.array,
  activeDevices: PropTypes.object,
  updateActiveDevice: PropTypes.func,
  videoStopped: PropTypes.bool,
  audioMuted: PropTypes.bool
};

export default DeviceDropdown;
