import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { userManagement as $content } from '../../content';
import { useNotif } from '../../contexts/Notification';
import { validateForm, formatError } from './validateForm';

const camelize = (str) =>
  str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, i) =>
      i > 0 ? word.toUpperCase() : word.toLowerCase()
    )
    .replace(/\s+/g, '');

const defaultInputProps = (inputLabel, isConfirm) => {
  const label = isConfirm ? `${$content.confirm} ${inputLabel}` : inputLabel;

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    name: camelize(label),
    placeholder: `${
      isConfirm ? $content.form.confirm_your : $content.form.enter_your
    } ${inputLabel.toLowerCase()}`,
    ...(isConfirm && {
      error: '',
      footer: null,
      description: '',
      confirms: camelize(inputLabel)
    })
  };
};

const generateInputProps = (inputsData) =>
  Object.entries(inputsData).reduce((inputProps, [inputLabel, options]) => {
    const { confirm, ...restOptions } = options;
    const camelizedInputLabel = camelize(inputLabel);
    inputProps[camelizedInputLabel] = {
      ...defaultInputProps(inputLabel),
      ...options
    };

    if (confirm) {
      // Add another input that will be used to confirm this input
      const confirmProps = {
        ...restOptions,
        ...defaultInputProps(inputLabel, true)
      };
      inputProps[confirmProps.name] = confirmProps;
    }

    return inputProps;
  }, {});

const useForm = (inputsData, submitHandler, onSuccess, onFailure) => {
  const { pathname } = useLocation();
  const [formProps, setFormProps] = useState(generateInputProps(inputsData));
  const [isLoading, setIsLoading] = useState(false);
  const { notifyError } = useNotif();

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

      if (pathname === '/register' || pathname === '/reset') {
        const validationErrors = validateForm(formProps, pathname);

        if (validationErrors) {
          updateErrors(validationErrors);
          return;
        } else updateErrors(null);
      }

      setIsLoading(true);
      const formValues = getValues(formProps);
      const { result, error } = await submitHandler(formValues);

      if (result) {
        clearForm();
        onSuccess(result, formValues);
      } else if (error) {
        const errorData = formatError(error);
        const { errorType, inputType, message } = errorData;

        if (errorType === 'notification') {
          notifyError(message); // Not an input-specific error, but rather some larger-scoped error
        } else {
          updateErrors({ [inputType]: message });
        }

        onFailure(errorData, formValues);
      }

      setIsLoading(false);
    },
    [
      clearForm,
      formProps,
      getValues,
      isLoading,
      notifyError,
      onFailure,
      onSuccess,
      pathname,
      submitHandler,
      updateErrors
    ]
  );

  return [formProps, isLoading, onChange, onSubmit];
};

export default useForm;
