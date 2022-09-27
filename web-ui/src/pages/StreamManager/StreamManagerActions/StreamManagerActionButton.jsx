import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { BUTTON_OUTLINE_CLASSES } from '../../../components/Button/ButtonTheme';
import { clsm } from '../../../utils';

const StreamManagerActionButton = forwardRef(({ name, onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
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
    {name}
  </button>
));

StreamManagerActionButton.propTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default StreamManagerActionButton;
