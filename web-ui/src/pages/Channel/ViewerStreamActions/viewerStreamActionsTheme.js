import { clsm } from '../../../utils';

const transition = {
  duration: 0.2,
  transition: { ease: 'easeInOut' }
};

export const defaultViewerStreamActionVariants = {
  visible: { y: 0, opacity: 1, transition },
  hidden: { y: 15, opacity: 0, transition }
};

export const reversedViewerStreamActionVariants = {
  ...defaultViewerStreamActionVariants,
  hidden: { y: -15, opacity: 0, transition }
};

export const defaultViewerStreamActionAnimationProps = {
  animate: 'visible',
  exit: 'hidden',
  initial: 'hidden'
};

export const correctAnswerClasses = clsm([
  'bg-darkMode-green',
  'hover:bg-darkMode-green',
  'focus:bg-darkMode-green',
  'focus:shadow-none',
  'animate-blink'
]);
export const incorrectAnswerClasses = clsm([
  'bg-darkMode-red',
  'hover:bg-darkMode-red',
  'focus:bg-darkMode-red',
  'focus:shadow-none',
  'animate-blink'
]);
