import { motion } from 'framer-motion';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import Button from '../../../../../components/Button/Button';
import { CloseFullscreen } from '../../../../../assets/icons';
import {
  ANIMATION_DURATION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { streamManager as $content } from '../../../../../content';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const Header = () => {
  const { handleOnClose } = useBroadcastFullScreen();

  return (
    <motion.div
      className={clsm(['absolute', 'z-[100]'])}
      {...createAnimationProps({
        animations: ['fadeIn-full'],
        customVariants: {
          hidden: {
            top: 0,
            right: 0
          },
          visible: {
            top: 20,
            right: 20,
            transition: {
              opacity: { delay: ANIMATION_DURATION }
            }
          }
        }
      })}
    >
      <Button
        ariaLabel={$webBroadcastContent.collapse}
        variant="icon"
        onClick={handleOnClose}
        className={clsm([
          '[&>svg]:fill-black',
          'bg-lightMode-gray',
          'dark:[&>svg]:fill-white',
          'dark:bg-darkMode-gray',
          'h-11',
          'hover:bg-lightMode-gray-hover',
          'w-11'
        ])}
      >
        <CloseFullscreen />
      </Button>
    </motion.div>
  );
};

export default Header;
