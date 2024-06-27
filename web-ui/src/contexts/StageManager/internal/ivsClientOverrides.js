import { LOG_LEVELS } from '../constants';

const GLOBAL_OVERRIDE_KEY = 'IVS_CLIENT_OVERRIDES';

// Set the log level to TRACE when running the app in development mode
setClientOverrideValue('logLevel', LOG_LEVELS[process.env.APP_ENV]);

// Emit a first frame event to analytics to record time to audio
setClientOverrideValue('enableFirstFrameAudio', true);

function getClientOverrideConfig() {
  return window[GLOBAL_OVERRIDE_KEY] ?? {};
}

function getClientOverrideValue(key) {
  return getClientOverrideConfig()[key];
}

function setClientOverrideValue(
  key,
  value
) {
  window[GLOBAL_OVERRIDE_KEY] = { ...getClientOverrideConfig(), [key]: value };
}

function unsetClientOverrideValue(key) {
  const overrideConfig = getClientOverrideConfig();
  delete overrideConfig[key];

  if (!Object.keys(overrideConfig).length) {
    delete window.IVS_CLIENT_OVERRIDES;
  }
}

export {
  getClientOverrideValue,
  setClientOverrideValue,
  unsetClientOverrideValue
};
