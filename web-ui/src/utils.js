import Amplify from '@aws-amplify/core';
import { extendTailwindMerge, fromTheme } from 'tailwind-merge';
import clsx from 'clsx';

import {
  CHANNEL_ARN_CHANNEL_ID_SEPARATOR,
  CHANNEL_TYPE,
  NUM_MILLISECONDS_TO_BLOCK
} from './constants';
import store from './store';
import { channelsAPI } from './api';

export const noop = () => {};

export const isiOS = () =>
  [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

export const scrollToTop = (
  selectorOrRef = '[id$=scrollable]',
  behavior = 'smooth'
) => {
  let scrollableContainer;

  if (typeof selectorOrRef === 'string') {
    scrollableContainer = document.querySelector(selectorOrRef) || window;
  } else {
    scrollableContainer = selectorOrRef.current;
  }

  if (scrollableContainer) scrollableContainer.scrollTo({ top: 0, behavior });
};

export const bound = (value, min = null, max = null) => {
  let boundedValue = value;

  if (min !== null) boundedValue = Math.max(min, value);
  if (max !== null) boundedValue = Math.min(max, boundedValue);

  return boundedValue;
};

/**
 * A rate limiting mechanism that retries an asynchronous operation until a maximum
 * retry count has been reached. The exponential backoff algorithm waits for a
 * duration of time that increases exponentially between each retry attempt.
 *
 * For instance, the exponential backoff schedule would look like the following:
 * wait 200ms, retry, wait 400ms, retry, wait 800ms, retry, wait 1600ms...
 *
 * @typedef {Object} RetryWithExponentialBackoffOptions
 * @property {Function} promiseFn An asynchronous function that returns a promise
 * @property {number} maxRetries The maximum number of retries that should be attempted
 * @property {Function} [onRetry=(nextRetries)=>{}] A callback function called before each retry attempt
 * @property {Function} [onSuccess=()=>{}] A callback function called when a retry attempt succeeds
 * @property {Function} [onFailure=()=>{}] A callback function called when all retry attempts have failed
 *
 * @param {RetryWithExponentialBackoffOptions} options
 */
export const retryWithExponentialBackoff = ({
  promiseFn,
  maxRetries,
  onRetry = noop,
  onSuccess = noop,
  onFailure = noop,
  shouldReturnErrorOnValidation = undefined
}) => {
  const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const retry = async (retries) => {
    try {
      // backoff
      if (retries > 0) {
        const timeToWait = 2 ** retries * 100;
        await waitFor(timeToWait);
      }

      // evaluate
      const result = await promiseFn();

      // handle scenario where the promiseFn involves the use of a fetch wrapper (unauthFetch or authFetch)
      const fetchWrapperError = !!result?.error;

      if (fetchWrapperError) {
        if (shouldReturnErrorOnValidation) {
          const shouldReturnError = shouldReturnErrorOnValidation(result);
          if (shouldReturnError) return result;
        }

        throw new Error();
      }

      onSuccess();

      return result;
    } catch (error) {
      if (retries < maxRetries) {
        // retry
        const nextRetries = retries + 1;
        onRetry(nextRetries);

        return retry(nextRetries);
      } else {
        // fail
        console.warn('Max retries reached. Bubbling the error up.');
        onFailure();
        throw error;
      }
    }
  };

  return retry(0);
};

const BASIC_BITRATE_LIMIT = 3.5; // Mbps
const STANDARD_BITRATE_LIMIT = 8.5; // Mbps
const ADVANCED_BITRATE_LIMIT = 3.5; // Mbps
const BASIC_RESOLUTION_LIMIT = '1080p (1280 x 720)';
const STANDARD_RESOLUTION_LIMIT = '1080p (1280 x 720)';
const ADVANCED_SD_RESOLUTION_LIMIT = '480p (1280 x 720)';
const ADVANCED_HD_RESOLUTION_LIMIT = '720p (1280 x 720)';

const BITRATE_LIMIT_SUB_KEY = '{BITRATE_LIMIT}';
const RESOLUTION_LIMIT_SUB_KEY = '{RESOLUTION_LIMIT}';
const BITRATE_SUB_KEY = '{bitrate}';
const RESOLUTION_SUB_KEY = '{resolution}';

export const substitutePlaceholders = (str = '', activeStreamSession) => {
  if (!activeStreamSession || !str) return str;

  const { channel, ingestConfiguration } = activeStreamSession;
  const { targetBitrate, videoHeight, videoWidth } =
    ingestConfiguration?.video || {};
  const { type: channelType } = channel || {};

  // Bitrate substitutions
  const targetBitrateMbps = targetBitrate * Math.pow(10, -6) || 0;
  str = str.replaceAll(BITRATE_SUB_KEY, targetBitrateMbps.toLocaleString());

  const channelLimits = {
    [CHANNEL_TYPE.BASIC]: {
      bitrateLimit: BASIC_BITRATE_LIMIT,
      resolutionLimit: BASIC_RESOLUTION_LIMIT
    },
    [CHANNEL_TYPE.STANDARD]: {
      bitrateLimit: STANDARD_BITRATE_LIMIT,
      resolutionLimit: STANDARD_RESOLUTION_LIMIT
    },
    [CHANNEL_TYPE.ADVANCED_HD]: {
      bitrateLimit: ADVANCED_BITRATE_LIMIT,
      resolutionLimit: ADVANCED_HD_RESOLUTION_LIMIT
    },
    [CHANNEL_TYPE.ADVANCED_SD]: {
      bitrateLimit: ADVANCED_BITRATE_LIMIT,
      resolutionLimit: ADVANCED_SD_RESOLUTION_LIMIT
    }
  };

  const { bitrateLimit = '', resolutionLimit = '' } =
    channelLimits[channelType];

  str = str.replaceAll(BITRATE_LIMIT_SUB_KEY, bitrateLimit.toLocaleString());

  // Resolution substitutions
  str = str.replaceAll(
    RESOLUTION_LIMIT_SUB_KEY,
    resolutionLimit.toLocaleString()
  );

  str = str.replaceAll(
    RESOLUTION_SUB_KEY,
    videoWidth && videoHeight ? `${videoWidth} x ${videoHeight}` : ''
  );

  return str;
};

/**
 * Construct a className string using a list of classes and then merge classes without style conflicts. The last conflicting class will win.
 * This utility function will replace clsx or txMerge everywhere in the application.
 * You might have to declare custom classes in the config extension to avoid collision with existing Tailwind classes.
 * extendTailwindMerge is a function provided by tailwind-merge that will extend the tailwind config.
 * A combination of the clsx (https://github.com/lukeed/clsx#readme)
 * and tailwind-merge (https://github.com/dcastil/tailwind-merge) packages.
 * @param {Array|String|Object|Boolean} classes
 */
const customTwMerge = extendTailwindMerge({
  classGroups: {
    shadow: [
      {
        shadow: [
          fromTheme('shadow'),
          'focus',
          'focusOuter',
          'hover',
          'hoverOuter'
        ],
        'shadow-color': [
          {
            shadow: [
              (value) => {
                const colorModeRegex = /(darkMode|lightMode)/i;
                colorModeRegex.test(value);
                return value;
              }
            ]
          }
        ]
      }
    ],
    text: ['text-p1', 'text-p2', 'text-p3', 'text-p4', 'text-h3']
  }
});

export const clsm = (...classes) => {
  if (!classes) return;

  return customTwMerge(clsx(classes));
};

/**
 * Composes functions. Can be used like so:
 * ```js
 * compose(fnA, fnB)(initialValue)
 * ```
 * More info: https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
 * @param  {...function} functions - as many functions as you want to compose
 * @returns {function} the composed function
 */
export const compose =
  (...functions) =>
  (fn) =>
    functions.reduceRight((augmentedFn, fn) => fn(augmentedFn), fn);

export const cloneObject = (obj) => {
  const dateReplacer = function (key, value) {
    return this[key] instanceof Date ? this[key].toUTCString() : value;
  };

  try {
    return structuredClone(obj);
  } catch (error) {
    // structuredClone is not supported by older browsers
    return JSON.parse(JSON.stringify(obj, dateReplacer));
  }
};

export const constructObjectPath = (path = [], value) => {
  const construct = (_path, _value) => {
    if (!_path.length) return _value;

    const pathKey = _path.pop();
    const nextValue = { [`${pathKey}`]: _value };

    return construct(_path, nextValue);
  };

  return construct(path.slice(0), cloneObject(value));
};

export const deconstructObjectPath = (path = [], value) => {
  const deconstruct = (_path, _value) => {
    if (!_path.length) return _value;

    const pathKey = _path.shift();
    const nextValue = _value[pathKey];

    return deconstruct(_path, nextValue);
  };

  return deconstruct(path.slice(0), cloneObject(value));
};

export const range = (length) => Array.from({ length }, (_, i) => i);

export const isTextColorInverted = (color) => ['green', 'blue'].includes(color);

export const setElementStyles = (element, styles = {}) => {
  if (!element) return;

  const cssText = Object.entries(styles).reduce(
    (cssTextAcc, [key, val]) => (cssTextAcc += `;${key}:${val}`),
    ''
  );

  element.style.cssText += cssText;
};

export const isElementOverflowing = (element) => {
  if (!element) return;

  const { clientWidth, clientHeight, scrollWidth, scrollHeight } = element;

  return scrollHeight > clientHeight || scrollWidth > clientWidth;
};

/**
 * Function to convert concurrent views to a value that will be displayed on the stream status bar.
 * For an example, 1000 views should be converted to 1K
 * @param {string|integer} views
 * @returns {string} view display value (ie. '100', '1K', '1.9M', '5.5B')
 */

export const convertConcurrentViews = (views) => {
  if (views < 1000 || isNaN(views)) return views.toString();

  let index = 0;
  const abbreviations = ['', 'K', 'M', 'B'];

  while (views >= 1000) {
    views /= 1000;
    index++;
  }

  const formattedViews = Number(
    Number.isInteger(views) ? views : views.toFixed(1)
  );

  return (
    (formattedViews % 1 === 0 ? formattedViews.toFixed() : formattedViews) +
    abbreviations[index]
  );
};

export const isS3Url = (url = '') => url.includes('.s3.');

export const extractChannelIdfromChannelArn = (channelArn) =>
  channelArn.split(CHANNEL_ARN_CHANNEL_ID_SEPARATOR)[1]?.toLowerCase();

export const updateVotes = (message, votes) => {
  const selectedOption = message.attributes?.option;

  return votes.map((voteOption) => {
    return voteOption.option === selectedOption
      ? { ...voteOption, count: voteOption.count + 1 }
      : voteOption;
  });
};

export const isVotingBlocked = (duration, startTime) => {
  const now = Date.now();

  return startTime + duration * 1000 - now <= NUM_MILLISECONDS_TO_BLOCK;
};

export const isElementsOverlapping = (element1, element2) => {
  const el1 = element1?.getBoundingClientRect();
  const el2 = element2?.getBoundingClientRect();

  return el1?.bottom > el2?.top && el1?.top < el2?.bottom;
};

export const decodeJWT = (token) => {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');

  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
};

export const containsURL = (text) => {
  const urlRegex = /(www\.|http:\/\/|https:\/\/)/;
  return urlRegex.test(text);
};

export function waitForReduxRehydration(reducer) {
  return new Promise((resolve) => {
    // Check if already rehydrated
    if (store.getState()[reducer]._persist?.rehydrated) {
      resolve();
      return;
    }

    // Set up subscription
    const unsubscribe = store.subscribe(() => {
      if (store.getState()[reducer]._persist?.rehydrated) {
        unsubscribe();
        resolve();
      }
    });

    /**
     * CAUTION: If Redux is not rehydrated by the time this timeout ends,
     * the loader will proceed with potentially stale or incomplete session storage data.
     * This may cause the loader to fail and trigger the error boundary.
     * Adjust the timeout duration if needed to balance between waiting for rehydration and ensuring the application doesn't hang indefinitely.
     */
    setTimeout(() => {
      unsubscribe();
      resolve();
    }, 300);
  });
}

export const connectToAppSyncGraphQlApi = () => {
  const {
    REACT_APP_APPSYNC_GRAPHQL_APIKEY,
    REACT_APP_APPSYNC_GRAPHQL_AUTH_TYPE,
    REACT_APP_APPSYNC_GRAPHQL_ENDPOINT,
    REACT_APP_REGION
  } = process.env;

  Amplify.configure({
    aws_appsync_graphqlEndpoint: REACT_APP_APPSYNC_GRAPHQL_ENDPOINT,
    aws_appsync_region: REACT_APP_REGION,
    aws_appsync_authenticationType: REACT_APP_APPSYNC_GRAPHQL_AUTH_TYPE,
    aws_appsync_apiKey: REACT_APP_APPSYNC_GRAPHQL_APIKEY
  });
};

export const channelDataFetcher = async (username) => {
  const { result: data, error } =
    await channelsAPI.getUserChannelData(username);

  if (error) throw error;

  return data;
};
