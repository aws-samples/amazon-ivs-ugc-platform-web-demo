import { clsm, substitutePlaceholders } from '../../../../../../utils';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import './LearnMoreMessage.css';
import { Close } from '../../../../../../assets/icons';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../../contexts/Streams';
import Button from '../../../../../../components/Button';

const LearnMoreMessage = ({ event: { name, longMsg }, toggleLearnMore }) => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView, isMobileView } = useResponsiveDevice();
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
          className={clsm([
            'absolute',
            'right-[15px]',
            '-top-[7px]',
            'w-11',
            'h-11'
          ])}
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
        className={clsm(['learn-more-message', isMobileView && 'pb-20'])}
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
