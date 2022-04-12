import './Spinner.css';

const diameter = '24px';
const strokeWidth = '4px';

const Spinner = () => (
  <span
    className="spinner"
    style={{ width: diameter, height: diameter }}
    role="progressbar"
  >
    <svg viewBox="22 22 44 44">
      <circle
        cx="44"
        cy="44"
        r="20.2"
        fill="none"
        strokeWidth={strokeWidth}
      ></circle>
    </svg>
  </span>
);

export default Spinner;
