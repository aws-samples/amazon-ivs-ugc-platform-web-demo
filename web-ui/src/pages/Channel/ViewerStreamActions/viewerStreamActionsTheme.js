import { clsm } from '../../../utils';

const defaultViewerStreamActionTransition = {
  duration: 1,
  ease: [1, -0.56, 0, 1]
};

export const defaultViewerStreamActionAnimationProps = {
  animate: 'visible',
  exit: 'hidden',
  initial: 'hidden',
  transition: defaultViewerStreamActionTransition
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
