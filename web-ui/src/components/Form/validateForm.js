const ERROR_MESSAGES = {
  EMAIL: 'Enter a valid email',
  USERNAME: 'Only letters, numbers & symbols are allowed.',
  PASSWORD: {
    LENGTH: 'Use 8 characters or more.',
    STRENGTH: 'At least 1 uppercase & lowercase letter, number, and symbol.'
  },
  CONFIRM_PASSWORD: 'Passwords didn’t match. Try again.'
};

export const validatePasswordLength = (password) => {
  const regex = /\S{8,256}/;
  return !!password && regex.test(password);
};

export const validatePasswordStrength = (password) => {
  const regex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.[\]{}()?\-"!@#%&/,><':;|_~`])/;
  return !!password && regex.test(password);
};

const validateEmail = (email) => {
  const regex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9])\])/;
  return !!email && regex.test(email);
};

const validateUsername = (username) => {
  const regex = /^\S+$/;
  return !!username && regex.test(username);
};

const validateForm = (formProps) => {
  const validationErrors = Object.entries(formProps).reduce(
    (errors, [key, { value, confirms }]) => {
      if (confirms) {
        if (!value || formProps[confirms].value !== value) {
          errors[key] = ERROR_MESSAGES.CONFIRM_PASSWORD;
        }
      }

      switch (key) {
        case 'username': {
          if (!validateUsername(value)) errors[key] = ERROR_MESSAGES.USERNAME;
          break;
        }
        case 'email': {
          if (!validateEmail(value)) errors[key] = ERROR_MESSAGES.EMAIL;
          break;
        }
        case 'password': {
          if (!validatePasswordLength(value)) {
            errors[key] = ERROR_MESSAGES.PASSWORD.LENGTH;
          } else if (!validatePasswordStrength(value)) {
            errors[key] = ERROR_MESSAGES.PASSWORD.STRENGTH;
          }
          break;
        }
        default:
          break;
      }

      return errors;
    },
    {}
  );

  return Object.keys(validationErrors).length ? validationErrors : null;
};

export default validateForm;
