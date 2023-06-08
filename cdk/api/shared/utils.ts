/**
 * A rate limiting mechanism that retries an asynchronous operation until a maximum
 * retry count has been reached. The constant backoff algorithm waits for a constant
 * duration of time, given by "delay," before executing the next retry attempt.
 *
 * For instance, if delay = 1000ms, the constant backoff schedule would like
 * the following: wait 1000ms, retry, wait 2000ms, retry, wait 3000ms...
 */
export const retryWithConstantBackoff = <T>({
  promiseFn,
  maxRetries,
  delay = 1000, // Ignored when isExponential = false
  shouldRetry = () => true,
  onRetry
}: {
  promiseFn: (...args: any[]) => Promise<T>;
  maxRetries: number;
  delay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (nextRetries: number, error: any) => void;
}) => {
  const waitFor = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const retry = async (retries: number): Promise<T> => {
    try {
      // backoff
      if (retries > 0) await waitFor(delay);

      // evaluate
      const result = await promiseFn();

      return result;
    } catch (error: any) {
      if (retries < maxRetries && shouldRetry(error)) {
        // retry
        const nextRetries = retries + 1;
        onRetry && onRetry(nextRetries, error);

        return retry(nextRetries);
      } else {
        // fail
        console.warn('Max retries reached. Bubbling the error up.');
        throw error;
      }
    }
  };

  return retry(0);
};
