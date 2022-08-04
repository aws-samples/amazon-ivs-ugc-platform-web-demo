import { useCallback, useState } from 'react';

import { scrollToTop } from '../../utils';
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
    isRequired: true,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    name: camelize(label),
    placeholder: `${
      isConfirm ? $content.form.confirm_your : $content.form.enter_your
    } ${inputLabel.toLowerCase()}`,
    error: null,
    ...(isConfirm && {
      footer: null,
      description: '',
      confirms: camelize(inputLabel)
    }),
    skipValidation: false,
    value: ''
  };
};

const generateInputProps = (inputsData) =>
  Object.entries(inputsData).reduce((inputProps, [inputLabel, options]) => {
    const { confirmedBy, ...restOptions } = options;
    const camelizedInputLabel = camelize(inputLabel);
    inputProps[camelizedInputLabel] = {
      ...defaultInputProps(inputLabel),
      ...options
    };

    if (confirmedBy) {
      // Add another input that will be used to confirm this input
      const confirmProps = {
        ...restOptions,
        ...defaultInputProps(inputLabel, true)
      };
      inputProps[confirmedBy] = confirmProps;
    }

    return inputProps;
  }, {});

const noop = () => {};

const useForm = ({
  disableValidation,
  errorHandler = noop,
  inputsData,
  onFailure = noop,
  onSuccess = noop,
  submitHandler,
  validationCheck = noop
}) => {
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
    (errors = null) =>
      setFormProps((prevFormProps) => {
        const nextFormProps = {};
        const shouldClearAllErrors = errors === null;

        for (const inputName in prevFormProps) {
          const inputProps = prevFormProps[inputName];
          const { error: prevError } = inputProps;
          let error;

          if (shouldClearAllErrors) {
            error = null;
          } else {
            if (inputName in errors) {
              error = errors[inputName];
            } else {
              error = prevError;
            }
          }

          nextFormProps[inputName] = { ...inputProps, error };
        }

        const shouldUpdateFormProps = Object.entries(nextFormProps).some(
          ([key, value]) =>
            prevFormProps[key].error !== nextFormProps[key].error
        );

        return shouldUpdateFormProps ? nextFormProps : prevFormProps;
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
      setFormProps((prevFormProps) => {
        if (!(name in prevFormProps))
          throw new Error(
            `No input exists with the name ${name} in this form! This typically occurs when confirmedBy does not point to an existing input name in the form.`
          );

        return {
          ...prevFormProps,
          [name]: { ...prevFormProps[name], value }
        };
      }),
    []
  );

  const presubmitValidation = useCallback(
    (inputName) => {
      let isFormValid = true;

      const autoValidationErrors = validateForm(formProps, inputName);
      const manualValidationErrors = validationCheck(formProps);
      const errors = { ...autoValidationErrors, ...manualValidationErrors };
      const validationErrors =
        autoValidationErrors || manualValidationErrors ? errors : null;

      updateErrors(validationErrors);
      isFormValid = Object.entries(validationErrors).every(
        ([_, value]) => value === null
      );

      return isFormValid;
    },
    [formProps, updateErrors, validationCheck]
  );

  const onSubmit = useCallback(
    async (event, clearFormOnSuccess = true) => {
      event.preventDefault();
      if (isLoading) return;

      if (!disableValidation) {
        const isFormValid = presubmitValidation();
        if (!isFormValid) return;
      }

      setIsLoading(true);
      const formValues = getValues(formProps);
      const { result, error } = await submitHandler(formValues);

      if (!error) {
        await onSuccess(result, formValues);
        if (clearFormOnSuccess) clearForm();
      } else {
        const errorData = errorHandler(error) || [defaultErrorHandler(error)];

        for (const { errorType, inputName, message } of errorData) {
          if (errorType === 'notification') {
            notifyError(message); // Not an input-specific error, but rather some larger-scoped error
          } else {
            updateErrors({ [inputName]: message });
          }
        }

        await onFailure(errorData, formValues);
      }

      scrollToTop();
      setIsLoading(false);
    },
    [
      isLoading,
      disableValidation,
      getValues,
      formProps,
      submitHandler,
      presubmitValidation,
      onSuccess,
      clearForm,
      errorHandler,
      onFailure,
      notifyError,
      updateErrors
    ]
  );

  return [formProps, isLoading, onChange, onSubmit, presubmitValidation];
};

export default useForm;
