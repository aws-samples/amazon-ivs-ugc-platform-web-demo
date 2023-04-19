const HIDDEN_INITIAL_VARIANT = 'hidden-initial';
const HIDDEN_EXIT_VARIANT = 'hidden-exit';
const VISIBLE_VARIANT = 'visible';

// Variants are sets of pre-defined targets. (https://www.framer.com/docs/animation/)
const defaultVariants = {
  [HIDDEN_INITIAL_VARIANT]: {},
  [VISIBLE_VARIANT]: {},
  [HIDDEN_EXIT_VARIANT]: {}
};

export const defaultTransition = { duration: 0.15, type: 'tween' };
export const getDefaultBounceTransition = (isVisible) => ({
  type: 'spring',
  bounce: isVisible ? 0.2 : 0,
  duration: 0.3,
  restSpeed: 10,
  velocity: 2
});

const defaultOptions = {
  shouldAnimateIn: true,
  shouldAnimateOut: true,
  isVisible: true, // Defines whether the animate prop is set to visible or hidden
  shouldAnimate: true
};

/**
 * Helper function to create animation props passed into an animated element. The function can accept a list of default animations or custom variants
 *
 * @param {array} [animations] - list of default animations used to create the Framer Motion variants object prop.
 * @param {AnimationControls} controls - manual controls that includes the start and stop methods provided by the Framer Motion useAnimation hook (https://www.framer.com/docs/use-animation-controls/).
 * @param {Object} [customVariants] - custom Framer Motion variants: visible, hidden, hiddenInitial, hiddenExit
 * @param {Object} [options] - options that change the default behaviour of shouldAnimateIn, shouldAnimateOut, isVisible, and shouldAnimate
 * @param {string|Object} [transition] - the animation transition can be default or bounce or an object that includes duration and type
 * @returns {Object} Framer Motion animation props
 */

export const createAnimationProps = ({
  animations = [],
  controls,
  customVariants,
  options: customOptions = {},
  transition = defaultTransition
}) => {
  const options = { ...defaultOptions, ...customOptions };

  if (!options.shouldAnimate) return;

  // Default transitions
  const bounceVariants = {};
  if (transition === 'bounce') {
    bounceVariants[VISIBLE_VARIANT] = {
      transition: getDefaultBounceTransition(true)
    };
    bounceVariants[HIDDEN_INITIAL_VARIANT] = {
      transition: getDefaultBounceTransition(false)
    };
    bounceVariants[HIDDEN_EXIT_VARIANT] =
      bounceVariants[HIDDEN_INITIAL_VARIANT];
  }

  // Default animations
  const variants = animations.reduce(
    (variants, animationName) => {
      switch (animationName) {
        case 'fadeIn-half':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            opacity: 0.5
          };
          variants[VISIBLE_VARIANT] = {
            ...variants[VISIBLE_VARIANT],
            opacity: 1
          };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            opacity: 0
          };
          break;
        case 'fadeIn-full':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            opacity: 0
          };
          variants[VISIBLE_VARIANT] = {
            ...variants[VISIBLE_VARIANT],
            opacity: 1
          };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            opacity: 0
          };
          break;
        case 'scale':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            scale: 0.75
          };
          variants[VISIBLE_VARIANT] = {
            ...variants[VISIBLE_VARIANT],
            scale: 1
          };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            scale: 0.75
          };
          break;
        case 'slideIn-top':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            y: '-100%'
          };
          variants[VISIBLE_VARIANT] = { ...variants[VISIBLE_VARIANT], y: 0 };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            y: '-100%'
          };
          break;
        case 'slideIn-right':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            x: '100%'
          };
          variants[VISIBLE_VARIANT] = { ...variants[VISIBLE_VARIANT], x: 0 };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            x: '100%'
          };
          break;
        case 'slideIn-bottom':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            y: '100%'
          };
          variants[VISIBLE_VARIANT] = { ...variants[VISIBLE_VARIANT], y: 0 };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            y: '100%'
          };
          break;
        case 'slideIn-left':
          variants[HIDDEN_INITIAL_VARIANT] = {
            ...variants[HIDDEN_INITIAL_VARIANT],
            x: '-100%'
          };
          variants[VISIBLE_VARIANT] = { ...variants[VISIBLE_VARIANT], x: 0 };
          variants[HIDDEN_EXIT_VARIANT] = {
            ...variants[HIDDEN_EXIT_VARIANT],
            x: '-100%'
          };
          break;
        default:
      }
      return variants;
    },
    { ...defaultVariants, ...bounceVariants }
  );

  // Custom animations
  if (customVariants?.visible) {
    variants[VISIBLE_VARIANT] = {
      ...variants[VISIBLE_VARIANT],
      ...customVariants[VISIBLE_VARIANT]
    };
  }
  if (customVariants?.hidden) {
    variants[HIDDEN_INITIAL_VARIANT] = {
      ...variants[HIDDEN_INITIAL_VARIANT],
      ...customVariants.hidden
    };
    variants[HIDDEN_EXIT_VARIANT] = {
      ...variants[HIDDEN_EXIT_VARIANT],
      ...customVariants.hidden
    };
  }
  if (customVariants?.hiddenInitial) {
    variants[HIDDEN_INITIAL_VARIANT] = {
      ...variants[HIDDEN_INITIAL_VARIANT],
      ...customVariants.hiddenInitial
    };
  }
  if (customVariants?.hiddenExit) {
    variants[HIDDEN_EXIT_VARIANT] = {
      ...variants[HIDDEN_EXIT_VARIANT],
      ...customVariants.hiddenExit
    };
  }

  return {
    animate:
      controls ||
      (options.isVisible ? VISIBLE_VARIANT : HIDDEN_INITIAL_VARIANT),
    initial: options.shouldAnimateIn ? HIDDEN_INITIAL_VARIANT : VISIBLE_VARIANT,
    exit: options.shouldAnimateOut ? HIDDEN_EXIT_VARIANT : VISIBLE_VARIANT,
    transition,
    variants
  };
};
