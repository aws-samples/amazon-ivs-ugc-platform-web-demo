import {
  PRODUCT_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../constants';
import { streamManager as $streamManagerContent } from '../../content';

const $content = $streamManagerContent.stream_manager_actions.input_error;
const FORMAT_VALIDATION_TYPE = { URL: 'url' };
const STREAM_MANAGER_ACTION_FORMATS = {
  [STREAM_ACTION_NAME.QUIZ]: {},
  [STREAM_ACTION_NAME.PRODUCT]: {
    [PRODUCT_DATA_KEYS.IMAGE_URL]: FORMAT_VALIDATION_TYPE.URL
  },
  [STREAM_ACTION_NAME.NOTICE]: {},
  [STREAM_ACTION_NAME.CELEBRATION]: {},
  [STREAM_ACTION_NAME.AMAZON_PRODUCT]: {},
  [STREAM_ACTION_NAME.POLL]: {}
};

// Character Length Validator
const validateLength = (str, min = -Infinity, max = Infinity) =>
  str.toString().length >= min && str.toString().length <= max;

// Format Validators
const validateUrl = (url) => {
  const regex =
    /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]+\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

  return validateLength(url, 0, 2048) && regex.test(url);
};

const getListOfDuplicateOptions = (value) => {
  const _duplicatesIdxArray = [];
  const answerCountMap = {};

  value.forEach((option, idx) => {
    if (option === '') return;

    const formattedString = option?.trim();
    answerCountMap[formattedString] =
      formattedString in answerCountMap ? ++answerCountMap[formattedString] : 1;

    if (answerCountMap[formattedString] > 1) {
      _duplicatesIdxArray.push(idx);
    }
  });

  return _duplicatesIdxArray;
};

// Main Validator
const defaultValidationOptions = {
  disableFormatValidation: false,
  disableLengthValidation: false,
  enableDuplicateValidation: false
};

const validate = (
  data,
  actionName,
  {
    disableFormatValidation = defaultValidationOptions.disableFormatValidation,
    disableLengthValidation = defaultValidationOptions.disableLengthValidation,
    enableDuplicateValidation = defaultValidationOptions.enableDuplicateValidation
  } = defaultValidationOptions
) =>
  Object.entries(data).reduce((errors, [key, value]) => {
    const limits = STREAM_MANAGER_ACTION_LIMITS[actionName][key] || {};
    const format = STREAM_MANAGER_ACTION_FORMATS[actionName][key] || {};

    if (Array.isArray(value)) {
      const messages = errors[key] || new Array(value.length); // messages array is fixed length to algin the error message with the appropriate value index
      let isInvalid = false;

      for (let i = 0; i < value.length; i++) {
        // Length check
        if (
          !disableLengthValidation &&
          !validateLength(value[i], 0, limits.maxCharLength)
        ) {
          messages[i] = $content.max_length_exceeded;
          isInvalid = true;
        }

        // Format check
        // Note: a format error takes precedence over a length error
        if (value[i] && format && !disableFormatValidation) {
          if (format === FORMAT_VALIDATION_TYPE.URL && !validateUrl(value[i])) {
            messages[i] = $content.enter_valid_url;
            isInvalid = true;
          }
        }
      }

      // Check whether answers/options are unique
      if (enableDuplicateValidation) {
        const listOfDuplicateOptions = getListOfDuplicateOptions(value);

        if (listOfDuplicateOptions.length) {
          for (const duplicateIdx of listOfDuplicateOptions) {
            messages[duplicateIdx] = $content.enter_a_unique_option;
            isInvalid = true;
          }
        }
      }

      if (isInvalid) return { ...errors, [key]: messages };
    } else {
      if (
        !disableLengthValidation &&
        !validateLength(value, 0, limits.maxCharLength)
      )
        return { ...errors, [key]: $content.max_length_exceeded };

      // Format check
      // Note: a format error takes precedence over a length error
      if (value && format && !disableFormatValidation) {
        if (format === FORMAT_VALIDATION_TYPE.URL && !validateUrl(value)) {
          return { ...errors, [key]: $content.enter_valid_url };
        }
      }
    }

    return errors;
  }, {});

export default validate;
