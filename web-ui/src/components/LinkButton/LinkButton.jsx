import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './LinkButton.css';

const LinkButton = ({ to, children, variant, className }) => {
  const classes = ['link-button', variant];
  if (className) classes.push(className);
  const classNames = classes.join(' ');

  return (
    <Link className={classNames} to={to}>
      {children}
    </Link>
  );
};

LinkButton.defaultProps = { className: '', variant: 'primary' };

LinkButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  to: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary'])
};

export default LinkButton;
