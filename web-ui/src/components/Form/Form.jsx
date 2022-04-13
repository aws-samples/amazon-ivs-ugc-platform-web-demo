import PropTypes from 'prop-types';

import Button from '../../components/Button';
import Input from '../../components/Input';
import useForm from './useForm';

import './Form.css';

const Form = ({ footer, inputsData, submitHandler, submitText, title }) => {
  const [formProps, isLoading, onChange, onSubmit] = useForm(
    inputsData,
    submitHandler
  );
  const isFormComplete = Object.values(formProps).every(({ value }) => value);

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>{title}</h2>
      {Object.values(formProps).map((inputProps) => (
        <Input {...inputProps} key={inputProps.name} onChange={onChange} />
      ))}
      <div className="submit-container">
        <Button
          type="submit"
          isDisabled={!isFormComplete}
          isLoading={isLoading}
        >
          {submitText}
        </Button>
        {footer}
      </div>
    </form>
  );
};

Form.defaultProps = { footer: null, inputsData: {} };

Form.propTypes = {
  footer: PropTypes.node,
  inputsData: PropTypes.object,
  submitHandler: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

export default Form;
