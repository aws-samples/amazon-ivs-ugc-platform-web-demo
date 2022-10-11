import { useCallback, useEffect, useState } from 'react';

import { constructObjectPath, deconstructObjectPath } from '../utils';
import useLatest from '../hooks/useLatest';
import usePrevious from './usePrevious';

const initializer = (key, initialValue, options) => {
  if (!key) return null;

  try {
    const { path, serialize, deserialize } = options;
    const localStorageItem = localStorage.getItem(key);

    if (localStorageItem === null) {
      if (initialValue != null) {
        const composedValue = constructObjectPath(path, initialValue);
        localStorage.setItem(key, serialize(composedValue));
      }

      return initialValue;
    } else {
      const deserializedValue = deserialize(localStorageItem);

      return deconstructObjectPath(path, deserializedValue);
    }
  } catch (error) {
    // If the user is in private mode or has a storage restriction, localStorage can throw.
    // JSON.parse and JSON.stringify can throw, too.
    console.error(error);

    return initialValue;
  }
};

const defaultOptions = {
  keyPrefix: '',
  path: [],
  serialize: JSON.stringify,
  deserialize: JSON.parse
};

/**
 * @typedef {Object} LocalStorageOptions
 * @property {string} [keyPrefix=''] An optional prefix appended to the key with a colon, as such: [keyPrefix]:[key]
 * @property {Array<string>} [path=[]] An optional working object path starting at the key where the value is read and written
 * @property {Function} [serialize=JSON.stringify] An optional custom serializer (defaults to JSON.stringify)
 * @property {Function} [deserialize=JSON.parse] An optional custom deserializer (defaults to JSON.parse)
 */

/**
 * @typedef {Object} LocalStorageConfig
 * @property {string} key Local storage key
 * @property {any} [initialValue=null] The value to store for the given key if no key value exists in local storage
 * @property {LocalStorageOptions} [options=defaultOptions] A set of options to further customize the behaviour of this hook
 *
 * @param {LocalStorageConfig} config
 */
const useLocalStorage = ({
  key,
  initialValue = null,
  options: {
    path = defaultOptions.path,
    keyPrefix = defaultOptions.keyPrefix,
    serialize = defaultOptions.serialize,
    deserialize = defaultOptions.deserialize
  } = defaultOptions
}) => {
  let localStorageKey;
  if (key) localStorageKey = keyPrefix ? [keyPrefix, key].join(':') : key;
  const prevLocalStorageKey = usePrevious(localStorageKey);
  const options = { path, keyPrefix, serialize, deserialize };
  const latestOptions = useLatest(options);
  const latestInitialValue = useLatest(initialValue);
  const [value, setValue] = useState(
    () => initializer(localStorageKey, initialValue, options) // lazy state initialization with local storage
  );

  /**
   * Initialization
   */
  useEffect(() => {
    setValue(
      initializer(
        localStorageKey,
        latestInitialValue.current,
        latestOptions.current
      )
    );

    // If localStorageKey changed, transfer the data to the
    // new key and remove the old local storage item
    if (
      localStorageKey &&
      prevLocalStorageKey &&
      prevLocalStorageKey !== localStorageKey
    ) {
      const item = localStorage.getItem(prevLocalStorageKey);
      if (item !== null) localStorage.setItem(localStorageKey, item);
      localStorage.removeItem(prevLocalStorageKey);
    }
  }, [latestInitialValue, latestOptions, localStorageKey, prevLocalStorageKey]);

  /**
   * Sets the value at the end of the working object path of the localStorageKey location
   */
  const set = useCallback(
    (valueOrFn) => {
      try {
        let valueToStore;

        setValue((prevValue) => {
          valueToStore =
            valueOrFn instanceof Function ? valueOrFn(prevValue) : valueOrFn;
          const { path, serialize } = latestOptions.current;
          const composedValue = constructObjectPath(path, valueToStore);
          const serializedValue = serialize(composedValue);
          localStorage.setItem(localStorageKey, serializedValue);

          return valueToStore;
        });

        return valueToStore;
      } catch (error) {
        // If the user is in private mode or has a storage restriction, localStorage can throw.
        // JSON.stringify can throw, too.
        console.error(error);
      }
    },
    [latestOptions, localStorageKey]
  );

  /**
   * Removes the entire value found at the localStorageKey location
   */

  const remove = useCallback(
    (removeByKeyPrefix = false) => {
      try {
        if (removeByKeyPrefix) {
          for (const _key of Object.keys(localStorage)) {
            const [_keyPrefix] = _key.split(':');
            if (_keyPrefix === keyPrefix) {
              localStorage.removeItem(_key);
            }
          }
        } else {
          localStorage.removeItem(localStorageKey);
        }

        setValue(null);
      } catch {
        // If the user is in private mode or has a storage restriction, localStorage can throw.
      }
    },
    [keyPrefix, localStorageKey]
  );

  return { value, set, remove };
};

export default useLocalStorage;
