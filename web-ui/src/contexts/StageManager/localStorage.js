import { APP_ENV, DEFAULT_SIMULCAST_CONFIG, STORAGE_VERSION } from './constants'

const isStagingEnv = process.env.APP_ENV === APP_ENV.STAGING;
const isLocalStorageSupported = (function isSupported() {
  try {
    localStorage.setItem('key', 'value');
    localStorage.removeItem('key');

    return true;
  } catch (e) {
    return false;
  }
})();

const defaultLocalStorageValues = {
  audioOnly: false,
  devices: { videoMirrored: false },
  showParticipantStats: isStagingEnv,
  simulcast: DEFAULT_SIMULCAST_CONFIG
};

function serialize(value) {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    return `${value}`;
  }
}

function deserialize(value) {
  try {
    return value && JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function getLocalStorageState() {
  const state = {};

  if (isLocalStorageSupported) {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      const item = key && localStorage.getItem(key);

      if (item !== null) {
        state[key] = deserialize(item);
      }
    }
  }

  return state;
}

function getLocalStorageValue(key) {
  let value = null;

  if (isLocalStorageSupported) {
    const item = localStorage.getItem(key);
    value = deserialize(item);
  }

  return value;
}

function setLocalStorageValue(
  key,
  value
) {
  if (isLocalStorageSupported) {
    localStorage.setItem(key, serialize(value));
  }
}

function removeLocalStorageValue(key) {
  if (isLocalStorageSupported) {
    localStorage.removeItem(key);
  }
}

function localStorageProvider() {
  const cache = new Map();
  const currentLocalStorageValues = getLocalStorageState();
  const initialLocalStorageValues = {
    ...defaultLocalStorageValues,
    ...currentLocalStorageValues
  };

  for (const [key, value] of Object.entries(initialLocalStorageValues)) {
    cache.set(key, { data: value });
  }

  if (isLocalStorageSupported) {
    if (STORAGE_VERSION !== localStorage.getItem('_storageVersion')) {
      localStorage.clear();
      localStorage.setItem('_storageVersion', STORAGE_VERSION);
    }

    // Write the cache back to local storage to update defaults
    for (const key of cache.keys()) {
      const value = cache.get(key)?.data;
      localStorage.setItem(key, serialize(value));
    }
  }

  return cache;
}

export {
  getLocalStorageState,
  getLocalStorageValue,
  isLocalStorageSupported,
  localStorageProvider,
  removeLocalStorageValue,
  setLocalStorageValue
};
