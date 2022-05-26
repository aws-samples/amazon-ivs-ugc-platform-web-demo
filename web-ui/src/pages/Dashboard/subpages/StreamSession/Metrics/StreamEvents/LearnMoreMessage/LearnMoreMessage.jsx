import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { useOutletContext } from 'react-router-dom';

import { Close } from '../../../../../../../assets/icons';
import { substitutePlaceholders } from './utils';
import './LearnMoreMessage.css';

const LearnMoreMessage = ({ event: { name, longMsg }, toggleLearnMore }) => {
  const { activeStreamSession } = useOutletContext();
  const subbedMsg = substitutePlaceholders(longMsg, activeStreamSession);

  return (
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
      <ReactMarkdown
        components={{
          p: ({ children, node, ...props }) => (
            <p className="p1" {...props}>
              {children}
            </p>
          ),
          li: ({ children, node, ordered, ...props }) => (
            <li {...props}>
              <span className="p1">{children}</span>
            </li>
          )
        }}
        skipHtml={true}
        className="learn-more-message"
      >
        {subbedMsg}
      </ReactMarkdown>
    </div>
  );
};

LearnMoreMessage.defaultProps = { event: {} };

LearnMoreMessage.propTypes = {
  event: PropTypes.object,
  toggleLearnMore: PropTypes.func.isRequired
};

export default LearnMoreMessage;
