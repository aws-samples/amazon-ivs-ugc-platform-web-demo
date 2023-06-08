import { motion } from 'framer-motion';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  defaultViewerStreamActionTransition,
  defaultSlideUpVariant
} from '../../../pages/Channel/ViewerStreamActions/viewerStreamActionsTheme';
import { clsm, isTextColorInverted, range } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { PROFILE_COLORS } from '../../../constants';
import { usePlayerContext } from '../contexts/Player';
import useResizeObserver from '../../../hooks/useResizeObserver';

const PARAGRAPH_BASE_CLASSES = [
  'font-bold',
  'pr-2',
  'py-4',
  'uppercase',
  'whitespace-nowrap'
];
const DEFAULT_ANIMATION_DURATION = 5; // in seconds

const Notice = ({
  color,
  message,
  onClickPlayerHandler,
  shouldShowStream,
  title
}) => {
  const messageRef = useRef();
  const marqueeRef = useRef();
  const [maxMessages, setMaxMessages] = useState(0);
  const { isOverlayVisible } = usePlayerContext();
  const shouldInvertColors = isTextColorInverted(color);
  // The animation duration is calculated dynamically to allow for ~5s per message
  const animationDuration = `${DEFAULT_ANIMATION_DURATION * maxMessages}s`;

  const updateMaxMessages = useCallback(() => {
    const { width: messageWidth } = messageRef.current.getBoundingClientRect();
    const { width: marqueeWidth } = marqueeRef.current.getBoundingClientRect();
    const maxMessages = Math.ceil(marqueeWidth / messageWidth);

    setMaxMessages(maxMessages);
  }, []);

  useResizeObserver(marqueeRef, updateMaxMessages);

  useLayoutEffect(() => {
    updateMaxMessages();
  }, [updateMaxMessages]);

  return (
    <motion.div
      {...createAnimationProps({
        animations: ['fadeIn-full'],
        customVariants: {
          visible: { ...defaultSlideUpVariant['visible'], x: '-50%' },
          hidden: { ...defaultSlideUpVariant['hidden'], x: '-50%' }
        },
        transition: defaultViewerStreamActionTransition
      })}
      className={clsm([
        'absolute',
        'bottom-7',
        'left-1/2',
        'lg:w-full',
        'max-w-full',
        'px-2',
        'transition-[margin]',
        'w-[60vw]',
        isOverlayVisible && shouldShowStream && ['mb-20', 'lg:mb-[52px]']
      ])}
      onClick={onClickPlayerHandler}
    >
      <div
        className={clsm([
          'flex',
          'items-center',
          'pl-1',
          'rounded-full',
          `bg-profile-${color}`
        ])}
      >
        <p
          className={clsm([
            'bg-black',
            'font-bold',
            'px-7',
            'py-3',
            'ring-4',
            'rounded-full',
            'shrink-0',
            'truncate',
            'uppercase',
            'xs:max-w-[80%]',
            `ring-profile-${color}`,
            `text-profile-${color}`,
            shouldInvertColors && 'bg-white'
          ])}
        >
          {title}
        </p>
        <div
          className={clsm([
            'flex',
            'overflow-x-hidden',
            'relative',
            'text-black',
            'w-full',
            shouldInvertColors && 'text-white'
          ])}
          ref={marqueeRef}
        >
          <div
            className={clsm(['flex', 'animate-marquee-first-part'])}
            style={{ animationDuration }}
          >
            {/* We use this message to get the length of one message */}
            <p
              aria-live="polite"
              className={clsm([PARAGRAPH_BASE_CLASSES])}
              ref={messageRef}
            >
              {message}
            </p>
            {range(maxMessages - 1).map((index) => (
              <p
                className={clsm([PARAGRAPH_BASE_CLASSES])}
                key={`marquee-first-part-message-${index}`}
              >
                {message}
              </p>
            ))}
          </div>
          <div
            className={clsm([
              'absolute',
              'animate-marquee-second-part',
              'flex',
              'top-0',
              'w-auto'
            ])}
            style={{ animationDuration }}
          >
            {range(maxMessages).map((index) => (
              <p
                className={clsm([PARAGRAPH_BASE_CLASSES])}
                key={`marquee-second-part-message-${index}`}
              >
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

Notice.propTypes = {
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  message: PropTypes.string,
  onClickPlayerHandler: PropTypes.func.isRequired,
  shouldShowStream: PropTypes.bool,
  title: PropTypes.string
};

Notice.defaultProps = {
  color: 'default',
  message: '',
  shouldShowStream: false,
  title: ''
};

export default Notice;
