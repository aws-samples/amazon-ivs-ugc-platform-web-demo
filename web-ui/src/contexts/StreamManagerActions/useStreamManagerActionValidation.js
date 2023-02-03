import { useCallback, useState } from 'react';

import useThrottledCallback from '../../hooks/useThrottledCallback';
import validate from './validate';

const useStreamManagerActionValidation = () => {
  const [
    currentStreamManagerActionErrors,
    setCurrentActiveStreamManagerErrors
  ] = useState({});

  /**
   * Validates the provided stream action form data and updates the
   * currentActiveStreamManagerErrors with any validation errors found
   */
  const validateStreamManagerActionData = useCallback(
    (inputData, actionName, options) => {
      const validationErrors = validate(inputData, actionName, options);
      const isValid = !Object.entries(validationErrors).length;

      setCurrentActiveStreamManagerErrors((prevErrors) =>
        Object.keys(inputData).reduce(
          (nextErrors, inputKey) => ({
            ...nextErrors,
            [inputKey]: validationErrors[inputKey] || undefined
          }),
          prevErrors
        )
      );

      return isValid;
    },
    []
  );

  /**
   * A throttled version of the validateStreamManagerActionData function.
   * Unlike the original, this throttled version will not return an isValid
   * value, since it it asynchronous in nature, and instead will only update
   * the error states. This function is intended to be called when you don't
   * need to know the immediate validation results, such as in the onChange
   * handler for stream manager action modal inputs, and thus should be
   * treated as a more performant approach of validating user input.
   */
  const throttledValidateStreamManagerActionData = useThrottledCallback(
    (inputData, actionName, options) =>
      validateStreamManagerActionData(inputData, actionName, options),
    400
  );

  /**
   * Resets the error data associated with the currently opened stream action modal
   */
  const resetStreamManagerActionErrorData = useCallback(() => {
    setCurrentActiveStreamManagerErrors({});
  }, []);

  return {
    currentStreamManagerActionErrors,
    resetStreamManagerActionErrorData,
    throttledValidateStreamManagerActionData,
    validateStreamManagerActionData
  };
};

export default useStreamManagerActionValidation;
