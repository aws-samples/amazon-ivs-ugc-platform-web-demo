import { userManagement as $content } from '../../content';

const { errorMessages } = $content;

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
  const validationErrors = Object.values(formProps).reduce(
    (errors, { value, name, confirms }) => {
      if (confirms) {
        if (!value || formProps[confirms].value !== value) {
          errors[name] = errorMessages.passwords_mismatch;
        }
        return errors;
      }

      switch (true) {
        case name.toLowerCase().includes('username'): {
          if (!validateUsername(value))
            errors[name] = errorMessages.invalid_username;
          break;
        }
        case name.toLowerCase().includes('email'): {
          if (!validateEmail(value)) errors[name] = errorMessages.invalid_email;
          break;
        }
        case name.toLowerCase().includes('password'): {
          const isValidLength = validatePasswordLength(value);
          const isValidStrength = validatePasswordStrength(value);

          if (!isValidLength && !isValidStrength) {
            errors[name] = errorMessages.invalid_password;
          } else if (!isValidLength) {
            errors[name] = errorMessages.invalid_password_length;
          } else if (!isValidStrength) {
            errors[name] = errorMessages.invalid_password_strength;
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
