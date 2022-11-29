import { clsm, substitutePlaceholders } from '../../../../../../utils';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import './LearnMoreMessage.css';
import { Close } from '../../../../../../assets/icons';
import { createAnimationProps } from '../../../../../../utils/animationPropsHelper';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../../contexts/Streams';
import Button from '../../../../../../components/Button';

const LearnMoreMessage = ({ event: { name, longMsg }, toggleLearnMore }) => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const subbedMsg = substitutePlaceholders(longMsg, activeStreamSession);

  return (
    <m.div
      {...createAnimationProps({
        animations: ['slideIn-right'],
        options: { shouldAnimate: !isDefaultResponsiveView }
      })}
      className="learn-more"
    >
      <span className="learn-more-header">
        <h3>{name}</h3>
        <Button
          className={clsm([
            'absolute',
            'right-[15px]',
            '-top-[10px]',
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
