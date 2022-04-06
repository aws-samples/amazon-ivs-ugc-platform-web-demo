import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import validateForm from './validateForm';

const defaultInputProps = (inputName, isConfirm) => {
  const displayName = isConfirm ? `confirm ${inputName}` : inputName;

  const camelize = (str) =>
    str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, i) =>
        i > 0 ? word.toUpperCase() : word.toLowerCase()
      )
      .replace(/\s+/g, '');

  return {
    label: displayName,
    name: camelize(displayName),
    placeholder: `${
      isConfirm ? 'Confirm' : 'Enter'
    } your ${inputName.toLowerCase()}`,
    ...(isConfirm && { error: '', footer: null, confirms: inputName })
  };
};

const generateInputProps = (inputsData) =>
  Object.entries(inputsData).reduce((inputProps, [inputName, options]) => {
    const { confirm, ...restOptions } = options;
    inputProps[inputName] = { ...defaultInputProps(inputName), ...options };

    if (confirm) {
      // Add another input that will be used to confirm this input
      const confirmProps = {
        ...restOptions,
        ...defaultInputProps(inputName, true)
      };
      inputProps[confirmProps.name] = confirmProps;
    }

    return inputProps;
  }, {});

const useForm = (inputsData, submitHandler) => {
  const { pathname } = useLocation();
  const [formProps, setFormProps] = useState(generateInputProps(inputsData));

  const getValues = useCallback(() => {
    const values = {};

    for (const key in formProps) {
      values[key] = formProps[key].value;
    }

    return values;
  }, [formProps]);

  const updateErrors = useCallback(
    (errors) =>
      setFormProps((prevFormProps) => {
        const nextFormProps = {};

        for (const key in prevFormProps) {
          const inputProps = prevFormProps[key];

          nextFormProps[key] = {
            ...inputProps,
            error: errors && errors[key] ? errors[key] : ''
          };
        }

        return nextFormProps;
      }),
    []
  );

  const clearForm = useCallback(() => {
    updateErrors(null);
    setFormProps((prevFormProps) => {
      const nextFormProps = {};

      for (const key in prevFormProps) {
        nextFormProps[key] = { ...prevFormProps[key], value: '' };
      }

      return nextFormProps;
    });
  }, [updateErrors]);

  const onChange = useCallback(
    ({ target: { name, value } }) =>
      setFormProps((prevFormProps) => ({
        ...prevFormProps,
        [name]: { ...formProps[name], value }
      })),
    [formProps]
  );

  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (pathname === '/register' || pathname === '/recover') {
        const validationErrors = validateForm(formProps, pathname);

        if (validationErrors) {
          updateErrors(validationErrors);
          return;
        }
      }

      try {
        const formValues = getValues(formProps);
        await submitHandler(formValues);
        clearForm();
      } catch (error) {
        console.error(error);
      }
    },
    [clearForm, formProps, getValues, pathname, submitHandler, updateErrors]
  );

  return [formProps, onChange, onSubmit];
};

export default useForm;
