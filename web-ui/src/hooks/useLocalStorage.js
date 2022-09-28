import { useCallback, useEffect, useState } from 'react';

import { constructObjectPath, deconstructObjectPath } from '../utils';
import useLatest from '../hooks/useLatest';

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
  const localStorageKey = keyPrefix ? [keyPrefix, key].join(':') : key;
  const options = { path, keyPrefix, serialize, deserialize };
  const latestOptions = useLatest(options);
  const latestInitialValue = useLatest(initialValue);
  const [value, setValue] = useState(
    () => (!!key ? initializer(localStorageKey, initialValue, options) : null) // lazy state initialization with local storage
  );

  useEffect(() => {
    if (!!key) {
      setValue(
        initializer(
          localStorageKey,
          latestInitialValue.current,
          latestOptions.current
        )
      );
    }
  }, [key, latestInitialValue, latestOptions, localStorageKey]);

  /**
   * Sets the value at the end of the working object path of the localStorageKey location
   */
  const set = useCallback(
    (value) => {
      try {
        setValue((prevValue) => {
          const { path, serialize } = latestOptions.current;
          const composedValue = constructObjectPath(path, value);
          const serializedValue = serialize(composedValue);
          localStorage.setItem(localStorageKey, serializedValue);

          return value;
        });
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
  const remove = useCallback(() => {
    try {
      localStorage.removeItem(localStorageKey);
      setValue(null);
    } catch {
      // If the user is in private mode or has a storage restriction, localStorage can throw.
    }
  }, [localStorageKey]);

  return { value, set, remove };
};

export default useLocalStorage;
