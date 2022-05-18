import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Button from '../../components/Button';
import Input from '../../components/Input';
import useForm from './useForm';
import './Form.css';

const Form = ({
  formVariant,
  inputVariant,
  submitBtnVariant,
  clearFormOnSuccess,
  disableSubmit,
  footer,
  inputsData,
  onFailure,
  onSuccess,
  submitHandler,
  submitText,
  title,
  validationCheck,
  errorHandler
}) => {
  const [formProps, isLoading, onChange, onSubmit] = useForm({
    inputsData,
    submitHandler,
    onSuccess,
    onFailure,
    validationCheck,
    errorHandler
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

  return (
    <form
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
            <Input {...inputProps} onChange={onChange} variant={inputVariant} />
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
  footer: null,
  formVariant: 'vertical',
  inputsData: {},
  inputVariant: 'vertical',
  onFailure: () => {},
  onSuccess: () => {},
  submitBtnVariant: 'primary',
  submitText: 'Submit',
  title: '',
  validationCheck: () => {},
  errorHandler: () => {}
};

Form.propTypes = {
  clearFormOnSuccess: PropTypes.bool,
  disableSubmit: PropTypes.func,
  errorHandler: PropTypes.func,
  footer: PropTypes.node,
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
