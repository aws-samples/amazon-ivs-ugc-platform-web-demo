import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useNotif } from '../../contexts/Notification';
import { userManagement as $content } from '../../content';
import { validateForm, defaultErrorHandler } from './validateForm';

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
      error: null,
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

const useForm = ({
  inputsData,
  submitHandler,
  onSuccess = () => {},
  onFailure = () => {},
  validationCheck = () => {},
  errorHandler = () => {}
}) => {
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

        for (const inputName in prevFormProps) {
          const inputProps = prevFormProps[inputName];
          const error = errors ? errors[inputName] : null;

          nextFormProps[inputName] = { ...inputProps, error };
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
    async (event, clearFormOnSuccess = true) => {
      event.preventDefault();
      if (isLoading) return;

      if (
        pathname === '/register' ||
        pathname === '/reset' ||
        pathname === '/settings'
      ) {
        const autoValidationErrors = validateForm(formProps, pathname);
        const manualValidationErrors = validationCheck(formProps);
        const validationErrors =
          autoValidationErrors || manualValidationErrors
            ? { ...autoValidationErrors, ...manualValidationErrors }
            : null;

        if (validationErrors) {
          updateErrors(validationErrors);
          return;
        } else updateErrors(null);
      }

      setIsLoading(true);
      const formValues = getValues(formProps);
      const { result, error } = await submitHandler(formValues);

      if (!error) {
        await onSuccess(result, formValues);
        if (clearFormOnSuccess) clearForm();
      } else {
        const errorData = errorHandler(error) || [defaultErrorHandler(error)];

        for (let { errorType, inputName, message } of errorData) {
          if (errorType === 'notification') {
            notifyError(message); // Not an input-specific error, but rather some larger-scoped error
          } else {
            updateErrors({ [inputName]: message });
          }
        }

        await onFailure(errorData, formValues);
      }

      setIsLoading(false);
    },
    [
      errorHandler,
      clearForm,
      formProps,
      getValues,
      isLoading,
      notifyError,
      onFailure,
      onSuccess,
      pathname,
      submitHandler,
      updateErrors,
      validationCheck
    ]
  );

  return [formProps, isLoading, onChange, onSubmit];
};

export default useForm;
