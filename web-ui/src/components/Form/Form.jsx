import PropTypes from 'prop-types';
import { useCallback, useMemo, useRef } from 'react';

import Button from '../../components/Button';
import Input from '../../components/Input';
import useForm from './useForm';
import { throttle } from '../../utils';
import './Form.css';

const Form = ({
  clearFormOnSuccess,
  disableSubmit,
  disableValidation,
  errorHandler,
  footer,
  formId,
  formVariant,
  inputsData,
  inputVariant,
  onFailure,
  onSuccess,
  submitBtnVariant,
  submitHandler,
  submitText,
  title,
  validationCheck
}) => {
  const [formProps, isLoading, onChange, onSubmit, presubmitValidation] =
    useForm({
      disableValidation,
      errorHandler,
      inputsData,
      onFailure,
      onSuccess,
      submitHandler,
      validationCheck
    });
  const isFormComplete = Object.values(formProps).every(({ value }) => value);

  const SubmitButton = useCallback(
    () => (
      <div className="submit-container">
        <Button
          type="submit"
          ariaDisabled={!isFormComplete || disableSubmit(formProps)}
          isLoading={isLoading}
          variant={submitBtnVariant}
          customStyles={{
            marginTop:
              inputVariant === 'vertical' && formVariant === 'horizontal'
                ? '33px'
                : 0
          }}
        >
          {submitText}
        </Button>
        {!!footer && <div className="button-link">{footer}</div>}
      </div>
    ),
    [
      disableSubmit,
      footer,
      formProps,
      formVariant,
      inputVariant,
      isFormComplete,
      isLoading,
      submitBtnVariant,
      submitText
    ]
  );

  const throttledPresubmitValidation = useMemo(
    () =>
      throttle((name) => {
        presubmitValidation(name);
        initialFocusedInputValue.current = '';
      }, 1000),
    [presubmitValidation]
  );

  const initialFocusedInputValue = useRef('');

  const onFocus = ({ target: { value } }) => {
    initialFocusedInputValue.current = value;
  };

  const onBlur = ({ relatedTarget, target: { name, value } }) => {
    if (relatedTarget?.type === 'submit') return;

    if (value && initialFocusedInputValue.current !== value) {
      // If onBlur causes a re-render, then onSubmit will not be called.
      // So we wrap the presubmit validation inside a setTimeout to give onSubmit a chance to be called.
      setTimeout(() => throttledPresubmitValidation(name));
    }
  };

  return (
    <form
      data-test-id={formId || undefined}
      className={`form ${formVariant}`}
      onSubmit={(e) => onSubmit(e, clearFormOnSuccess)}
    >
      {title && <h2>{title}</h2>}
      {Object.values(formProps).map((inputProps, i, arr) => {
        if (formVariant === 'vertical') {
          return (
            <Input
              {...inputProps}
              key={inputProps.name}
              onBlur={disableValidation ? undefined : onBlur}
              onFocus={disableValidation ? undefined : onFocus}
              onChange={onChange}
              variant={inputVariant}
            />
          );
        }

        const hasSubmitButton =
          i === arr.length - 1 && formVariant === 'horizontal';
        return (
          <div
            className={`input-format-container ${
              !hasSubmitButton ? 'with-spacing' : ''
            }`}
            key={inputProps.name}
          >
            <Input
              {...inputProps}
              onBlur={disableValidation ? undefined : onBlur}
              onFocus={disableValidation ? undefined : onFocus}
              onChange={onChange}
              variant={inputVariant}
            />
            {hasSubmitButton && <SubmitButton />}
          </div>
        );
      })}
      {formVariant === 'vertical' && <SubmitButton />}
    </form>
  );
};

Form.defaultProps = {
  clearFormOnSuccess: true,
  disableSubmit: () => {},
  disableValidation: false,
  errorHandler: () => {},
  footer: null,
  formId: '',
  formVariant: 'vertical',
  inputsData: {},
  inputVariant: 'vertical',
  onFailure: () => {},
  onSuccess: () => {},
  submitBtnVariant: 'primary',
  submitText: 'Submit',
  title: '',
  validationCheck: () => {}
};

Form.propTypes = {
  clearFormOnSuccess: PropTypes.bool,
  disableSubmit: PropTypes.func,
  disableValidation: PropTypes.bool,
  errorHandler: PropTypes.func,
  footer: PropTypes.node,
  formId: PropTypes.string,
  formVariant: PropTypes.oneOf(['vertical', 'horizontal']),
  inputsData: PropTypes.object,
  inputVariant: PropTypes.oneOf(['vertical', 'horizontal']),
  onFailure: PropTypes.func,
  onSuccess: PropTypes.func,
  submitBtnVariant: PropTypes.oneOf([
    'primary',
    'tertiary',
    'secondary',
    'destructive',
    'link'
  ]),
  submitHandler: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
  title: PropTypes.string,
  validationCheck: PropTypes.func
};

export default Form;
