import PropTypes from 'prop-types';

import { Close } from '../../../../../../../assets/icons';
import './LearnMoreMessage.css';

const LearnMoreMessage = ({ event: { name, longMsg }, toggleLearnMore }) => (
  <div className="learn-more-container">
    <span className="learn-more-header">
      <h3>{name}</h3>
      <button
        className="close-learn-more-btn"
        onClick={toggleLearnMore}
        type="button"
      >
        <Close className="close-icon" />
      </button>
    </span>
    <p className="learn-more-message p1">{longMsg}</p>
  </div>
);

LearnMoreMessage.defaultProps = { event: {} };

LearnMoreMessage.propTypes = {
  event: PropTypes.object,
  toggleLearnMore: PropTypes.func.isRequired
};

export default LearnMoreMessage;
