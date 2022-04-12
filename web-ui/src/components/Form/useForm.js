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
    ...(isConfirm && {
      error: '',
      footer: null,
      description: '',
      confirms: inputName
    })
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
  const [isLoading, setIsLoading] = useState(false);

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
    setFormProps((prevFormProps) => {
      const nextFormProps = {};

      for (const key in prevFormProps) {
        nextFormProps[key] = { ...prevFormProps[key], value: '' };
      }

      return nextFormProps;
    });
  }, []);

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
      if (isLoading) return;

      if (pathname === '/register' || pathname === '/recover') {
        const validationErrors = validateForm(formProps, pathname);

        if (validationErrors) {
          updateErrors(validationErrors);
          return;
        }
      }

      setIsLoading(true);
      updateErrors(null);

      const formValues = getValues(formProps);
      // TEMPORARY
      // eslint-disable-next-line no-unused-vars
      const { result, error } = await submitHandler(formValues);
      if (result) clearForm();
      setIsLoading(false);
    },
    [
      clearForm,
      formProps,
      getValues,
      isLoading,
      pathname,
      submitHandler,
      updateErrors
    ]
  );

  return [formProps, isLoading, onChange, onSubmit];
};

export default useForm;
