import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../constants';
import { BUTTON_VARIANT_CLASSES as variantClasses } from './FormTheme';
import { clsm, noop } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../../components/Button';
import Input from '../../components/Input';
import useForm from './useForm';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const Form = ({
  'data-testid': dataTestId,
  className,
  clearFormOnSuccess,
  disableSubmit,
  disableValidation,
  errorHandler,
  footer,
  formVariant,
  inputsData,
  inputVariant,
  onFailure,
  onSuccess,
  submitBtnVariant,
  submitHandler,
  submitText,
  title,
  validationCheck,
  type
}) => {
  const [formProps, isLoading, onChange, onSubmit, presubmitValidation] =
    useForm({
      disableValidation,
      errorHandler,
      inputsData,
      onFailure,
      onSuccess,
      submitHandler,
      validationCheck,
      type
    });

  const isFormComplete = Object.values(formProps).every(({ value }) => value);
  const { currentBreakpoint } = useResponsiveDevice();
  const isMobileView = currentBreakpoint < BREAKPOINTS.sm;
  const classes = clsm(variantClasses[formVariant], className);

  const SubmitButton = useCallback(
    () => (
      <div
        className={clsm([
          'flex',
          'flex-col',
          'space-y-8',
          'text-center',
          'self-stretch'
        ])}
      >
        <Button
          type="submit"
          ariaDisabled={!isFormComplete || disableSubmit(formProps)}
          isLoading={isLoading}
          variant={submitBtnVariant}
          data-testid={`${dataTestId}-submit-button`}
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
      submitText,
      dataTestId
    ]
  );

  const throttledPresubmitValidation = useThrottledCallback((name) => {
    presubmitValidation(name);
    initialFocusedInputValue.current = '';
  }, 1000);

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
      data-testid={dataTestId}
      className={classes}
      onSubmit={(e) => onSubmit(e, clearFormOnSuccess)}
    >
      {title && <h1 className={isMobileView ? 'h2' : ''}>{title}</h1>}
      {Object.values(formProps).map((inputProps, i, arr) => {
        if (formVariant === 'vertical') {
          return (
            <Input
              {...inputProps}
              key={inputProps.name}
              onBlur={disableValidation ? undefined : onBlur}
              onChange={onChange}
              onFocus={disableValidation ? undefined : onFocus}
              variant={inputVariant}
            />
          );
        }

        const hasSubmitButton =
          i === arr.length - 1 && formVariant === 'horizontal';
        return (
          <div
            className={clsm([
              'flex',
              'input-format-container',
              'space-x-2',
              formVariant === 'horizontal' && 'items-end',
              !hasSubmitButton && ['mr-[108px]', 'xs:m-0']
            ])}
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
  'data-testid': undefined,
  className: '',
  clearFormOnSuccess: true,
  disableSubmit: noop,
  disableValidation: false,
  errorHandler: noop,
  footer: null,
  formVariant: 'vertical',
  inputsData: {},
  inputVariant: 'vertical',
  onFailure: noop,
  onSuccess: noop,
  submitBtnVariant: 'primary',
  submitText: 'Submit',
  title: '',
  type: '',
  validationCheck: noop
};

Form.propTypes = {
  'data-testid': PropTypes.string,
  className: PropTypes.string,
  clearFormOnSuccess: PropTypes.bool,
  disableSubmit: PropTypes.func,
  disableValidation: PropTypes.bool,
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
  type: PropTypes.string,
  validationCheck: PropTypes.func
};

export default Form;
