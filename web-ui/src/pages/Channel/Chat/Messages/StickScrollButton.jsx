import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { BUTTON_BASE_CLASSES } from '../../../../components/Button/ButtonTheme';
import { channel as $channelContent } from '../../../../content';
import { clsm } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { DownArrow } from '../../../../assets/icons';

const $content = $channelContent.chat;

const StickScrollButton = ({ isSticky, scrollToBottom }) => (
  <AnimatePresence>
    {!isSticky && (
      <motion.div
        {...createAnimationProps({
          animations: ['fadeIn-full', 'scale'],
          customVariants: {
            hidden: { y: '25%' },
            visible: { y: 0 }
          }
        })}
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
      </motion.div>
    )}
  </AnimatePresence>
);

StickScrollButton.defaultProps = { isSticky: true };

StickScrollButton.propTypes = {
  isSticky: PropTypes.bool,
  scrollToBottom: PropTypes.func.isRequired
};

export default StickScrollButton;
