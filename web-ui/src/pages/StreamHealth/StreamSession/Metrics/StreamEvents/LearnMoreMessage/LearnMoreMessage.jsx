import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { m } from 'framer-motion';

import './LearnMoreMessage.css';
import { Close } from '../../../../../../assets/icons';
import { substitutePlaceholders } from '../../../../../../utils';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../../contexts/Streams';
import Button from '../../../../../../components/Button';

const LearnMoreMessage = ({ event: { name, longMsg }, toggleLearnMore }) => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const subbedMsg = substitutePlaceholders(longMsg, activeStreamSession);

  return (
    <m.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={
        !isDefaultResponsiveView && { hidden: { x: '100%' }, visible: { x: 0 } }
      }
      transition={{ duration: 0.25, type: 'tween' }}
      className="learn-more"
    >
      <span className="learn-more-header">
        <h3>{name}</h3>
        <Button
          className="learn-more-btn"
          onClick={toggleLearnMore}
          variant="icon"
        >
          <Close className="close-icon" />
        </Button>
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
    </m.div>
  );
};

LearnMoreMessage.defaultProps = { event: {} };

LearnMoreMessage.propTypes = {
  event: PropTypes.object,
  toggleLearnMore: PropTypes.func.isRequired
};

export default LearnMoreMessage;
