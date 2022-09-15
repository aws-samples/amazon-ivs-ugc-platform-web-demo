import { AnimatePresence, m } from 'framer-motion';
import PropTypes from 'prop-types';

import { BUTTON_BASE_CLASSES } from '../../../../components/Button/ButtonTheme';
import { channel as $channelContent } from '../../../../content';
import { clsm } from '../../../../utils';
import { DownArrow } from '../../../../assets/icons';

const $content = $channelContent.chat;
const defaultTransition = { duration: 0.25, type: 'tween' };

const StickScrollButton = ({ isSticky, scrollToBottom }) => (
  <AnimatePresence>
    {!isSticky && (
      <m.div
        animate="visible"
        initial="hidden"
        exit="hidden"
        variants={{
          visible: { opacity: 1, y: 0, scale: 1 },
          hidden: { opacity: 0, y: '25%', scale: 0.75 }
        }}
        transition={defaultTransition}
        className={clsm(['bottom-2', 'flex', 'justify-center', 'pb-3'])}
      >
        <button
          aria-label="Show new messages"
          className={clsm(
            BUTTON_BASE_CLASSES,
            '[&>svg]:!fill-white',
            '[&>svg]:h-4',
            '[&>svg]:mr-2',
            '[&>svg]:w-4',
            'bg-lightMode-gray-medium',
            'dark:[&>svg]:!fill-black',
            'dark:bg-darkMode-gray-light',
            'dark:focus:bg-darkMode-gray-light',
            'dark:hover:bg-darkMode-gray-light-hover',
            'dark:text-black',
            'focus-visible:outline-none',
            'focus-visible:outline-offset-0',
            'h-9',
            'hover:bg-lightMode-gray-medium-hover',
            'px-4',
            'text-white'
          )}
          type="button"
          onClick={scrollToBottom}
        >
          <DownArrow />
          {$content.new_messages}
        </button>
      </m.div>
    )}
  </AnimatePresence>
);

StickScrollButton.defaultProps = { isSticky: true };

StickScrollButton.propTypes = {
  isSticky: PropTypes.bool,
  scrollToBottom: PropTypes.func.isRequired
};

export default StickScrollButton;
