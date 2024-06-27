export function noop() {
  // No operation performed.
}

export function isFulfilled(input) {
  return input.status === 'fulfilled';
}

export function isRejected(input) {
  return input.status === 'rejected';
}

export function debounce(callback, waitFor, leading = false) {
  let timeout;

  function debounced(...args) {
    if (leading && !timeout) {
      callback(...args);
    }

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = undefined;

      if (!leading) {
        callback(...args);
      }
    }, waitFor);
  }

  function cancel() {
    clearTimeout(timeout);
    timeout = undefined;
  }

  debounced.cancel = cancel;

  return debounced;
}
