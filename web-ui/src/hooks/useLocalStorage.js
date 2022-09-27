import { useCallback, useEffect, useState } from 'react';

import { constructObjectPath, deconstructObjectPath } from '../utils';
import useLatest from '../hooks/useLatest';

const serialize = JSON.stringify;
const deserialize = JSON.parse;

const initializer = (key, initialValue, path) => {
  if (!key) return null;

  try {
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

/**
 * @typedef {Object} LocalStorageConfig
 * @property {string} key local storage key
 * @property {string} [keyPrefix=''] an optional prefix appended to the key with a colon, as such: <keyPrefix>:<key>
 * @property {any} [initialValue=null] the value to store for the given key if no key value exists in local storage
 * @property {Array<string>} [path=[]] an optional working object path starting at the key where the value is read and written
 *
 * @param {LocalStorageConfig} config
 */
const useLocalStorage = ({
  key,
  keyPrefix = '',
  initialValue = null,
  path = []
}) => {
  const localStorageKey = [keyPrefix, key].join(':');
  const latestInitialValue = useLatest(initialValue);
  const latestPath = useLatest(path);
  const [value, setValue] = useState(
    () => !!key && initializer(localStorageKey, initialValue, path) // lazy state initialization with local storage
  );

  useEffect(() => {
    if (!!key) {
      setValue(
        initializer(
          localStorageKey,
          latestInitialValue.current,
          latestPath.current
        )
      );
    }
  }, [localStorageKey, latestInitialValue, latestPath, key]);

  /**
   * Sets the value at the end of the working object path of the localStorageKey location
   */
  const set = useCallback(
    (value) => {
      try {
        setValue((prevValue) => {
          const composedValue = constructObjectPath(latestPath.current, value);
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
    [localStorageKey, latestPath]
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
