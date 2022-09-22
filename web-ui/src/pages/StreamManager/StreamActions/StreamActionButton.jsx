import { clsm } from '../../../utils';
import { BUTTON_OUTLINE_CLASSES } from '../../../components/Button/ButtonTheme';

const StreamActionButton = () => (
  <button
    className={clsm(
      [
        'bg-profile-green',
        'dark:shadow-white',
        'focus:outline-none',
        'focus:shadow-focus',
        'hover:bg-profile-green-hover',
        'rounded-xl',
        'shadow-black',
        'sm:aspect-square',
        'sm:h-auto',
        'text-white'
      ],
      BUTTON_OUTLINE_CLASSES
    )}
  >
    Stream action
  </button>
);

export default StreamActionButton;
