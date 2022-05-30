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

export const copyToClipboard = (value) => {
  if (isiOS()) {
    const textArea = document.createElement('textArea');
    textArea.value = value;
    textArea.readOnly = true;
    document.body.appendChild(textArea);

    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textArea.setSelectionRange(0, 999999);

    document.execCommand('copy');
    document.body.removeChild(textArea);
  } else {
    navigator.clipboard.writeText(value);
  }
};

export const scrollToTop = (
  selector = '[id$=scrollable]',
  behavior = 'smooth'
) => {
  const scrollableContainer = document.querySelector(selector) || window;

  scrollableContainer.scrollTo({ top: 0, behavior });
};

export const bound = (value, min = null, max = null) => {
  let boundedValue = value;

  if (min !== null) boundedValue = Math.max(min, value);
  if (max !== null) boundedValue = Math.min(max, boundedValue);

  return boundedValue;
};

/**
 * Executes a callback function predictably, after a certain delay.
 * Throttling a function prevents excessive or repeated calling of the function,
 * but does not get reset in the process
 *  - i.e. acts as a rate limiter for execution of handlers
 * @param {func} callback
 * @param {number} delay
 * @param {boolean} debounceMode
 */
export const throttle = (callback, delay, debounceMode) => {
  let timeoutID;
  let cancelled = false;
  let lastExec = 0;
  const clearExistingTimeout = () => {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
  };

  const wrapper = (...args) => {
    const elapsed = Date.now() - lastExec;
    const exec = () => {
      lastExec = Date.now();
      callback(...args);
    };

    if (cancelled) {
      return;
    }
    if (debounceMode && !timeoutID) {
      exec();
    }
    clearExistingTimeout();
    if (debounceMode === undefined && elapsed > delay) {
      exec();
    } else {
      const clearTimeoutID = () => {
        timeoutID = undefined;
      };
      timeoutID = setTimeout(
        debounceMode ? clearTimeoutID : exec,
        debounceMode === undefined ? delay - elapsed : delay
      );
    }
  };

  wrapper.cancel = () => {
    clearExistingTimeout();
    cancelled = true;
  };
  return wrapper;
};

/**
 * Stalls the execution of a callback function for a predetermined
 * amount of time, so long as it continues to be invoked
 * @param {*} callback function to debounce
 * @param {*} delay stall delay
 * @param {*} atBegin true if callback is to be executed before stalling
 *                    initiates, false if after stalling period ends
 */
export const debounce = (callback, delay, atBegin = false) => {
  return throttle(callback, delay, atBegin);
};
