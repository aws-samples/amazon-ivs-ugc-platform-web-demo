import { clsm, substitutePlaceholders } from '../../../../../utils';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import { Close } from '../../../../../assets/icons';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../contexts/Streams';
import Button from '../../../../../components/Button';

const LearnMoreMessage = ({
  event: { name, longMsg } = {},
  toggleLearnMore
}) => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const subbedMsg = substitutePlaceholders(longMsg, activeStreamSession);

  return (
    <motion.div
      {...createAnimationProps({
        animations: ['slideIn-right'],
        options: { shouldAnimate: !isDefaultResponsiveView }
      })}
      className={clsm([
        'absolute',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-medium',
        'h-full',
        'max-w-xs',
        'md:dark:border-darkMode-gray',
        'md:dark:border-t-2',
        'md:dark:pt-[30px]',
        'md:max-w-full',
        'md:rounded-none',
        'px-0',
        'py-8',
        'rounded-3xl',
        'top-0',
        'w-full'
      ])}
    >
      <span
        className={clsm([
          'dark:text-white',
          'flex',
          'items-center',
          'justify-between',
          'mb-5',
          'min-h-[24px]',
          'pl-4',
          'pr-[68px]',
          'py-0',
          'relative',
          'text-lightMode-gray-dark'
        ])}
      >
        <h3>{name}</h3>
        <Button
          className={clsm([
            'absolute',
            'right-4',
            '-top-[10px]',
            'w-11',
            'h-11'
          ])}
          onClick={toggleLearnMore}
          variant="icon"
        >
          <Close
            className={clsm(['dark:fill-white', 'fill-lightMode-gray-dark'])}
          />
        </Button>
      </span>
      <ReactMarkdown
        className={clsm([
          'h-[calc(100%_-_16px)]',
          'overflow-auto',
          'pb-8',
          'pt-0',
          'px-4',
          'scrollbar-mb-4',
          'overflow-y-overlay',
          'supports-overlay:overflow-y-overlay'
        ])}
        components={{
          p: ({ children, node, ...props }) => (
            <p
              className={clsm([
                'dark:text-darkMode-gray-extraLight',
                'text-lightMode-gray-dark',
                'text-p1'
              ])}
              {...props}
            >
              {children}
            </p>
          ),
          h4: ({ children, node, ...props }) => (
            <h4 className={clsm(['mt-10', 'mb-5'])} {...props}>
              {children}
            </h4>
          ),
          ul: ({ children, node, ...props }) => (
            <ul
              className={clsm([
                'list-disc',
                'list-outside',
                'ml-2',
                'px-4',
                'py-0',
                'space-y-1'
              ])}
              {...props}
            >
              {children}
            </ul>
          ),
          li: ({ children, node, ordered, ...props }) => (
            <li
              {...props}
              className={clsm([
                'dark:text-darkMode-gray-extraLight',
                'text-lightMode-gray-dark'
              ])}
            >
              <span className="text-p1">{children}</span>
            </li>
          )
        }}
        skipHtml={true}
      >
        {subbedMsg}
      </ReactMarkdown>
    </motion.div>
  );
};

LearnMoreMessage.propTypes = {
  event: PropTypes.object,
  toggleLearnMore: PropTypes.func.isRequired
};

export default LearnMoreMessage;
