import PropTypes from 'prop-types';

import './StaticNotification.css';

const StaticNotification = ({ cta, message }) => (
  <div className="static-notification-container">
    <div className="static-notification-content">
      <p className="p1">{message}</p>
    </div>
    {cta}
  </div>
);

StaticNotification.propTypes = {
  cta: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired
};

export default StaticNotification;
