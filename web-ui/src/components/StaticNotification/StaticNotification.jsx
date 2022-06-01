import PropTypes from 'prop-types';

import './StaticNotification.css';

const StaticNotification = ({ cta, icon, message }) => (
  <div className="static-notification-container">
    <div className="static-notification-content">
      {icon}
      <p className="p1">{message}</p>
    </div>
    {cta}
  </div>
);

StaticNotification.defaultProps = { icon: null };

StaticNotification.propTypes = {
  cta: PropTypes.node.isRequired,
  icon: PropTypes.node,
  message: PropTypes.string.isRequired
};

export default StaticNotification;
