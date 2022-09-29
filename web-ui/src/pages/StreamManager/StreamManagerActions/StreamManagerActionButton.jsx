import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { BUTTON_OUTLINE_CLASSES } from '../../../components/Button/ButtonTheme';
import { clsm } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';
import { useStreamManagerActions } from '../../../contexts/StreamManagerActions';
import useCountdown from '../../../hooks/useCountdown';

const $content = $streamManagerContent.stream_manager_actions;

const StreamManagerActionButton = forwardRef(
  ({ ariaLabel, children, name, onClick }, ref) => {
    const { activeStreamManagerActionData, stopStreamAction } =
      useStreamManagerActions();
    const {
      name: activeStreamManagerActionName,
      expiry: activeStreamManagerActionExpiry
    } = activeStreamManagerActionData || {};
    const isActive = name === activeStreamManagerActionName;
    const isPerpetual = isActive && !activeStreamManagerActionExpiry;
    const timeLeft = useCountdown({
      expiry: activeStreamManagerActionExpiry,
      formatter: (timeLeft) =>
        `${Math.ceil(timeLeft / 1000)}${$content.unit_seconds}`,
      isEnabled: isActive && !isPerpetual,
      onExpiry: stopStreamAction
    });

    const handleClick = () => {
      if (isActive) stopStreamAction();
      else onClick();
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-label={ariaLabel}
        className={clsm(
          [
            'bg-profile-green',
            'dark:shadow-white',
            'duration-[0.15s]',
            'ease-in-out',
            'focus:outline-none',
            'focus:shadow-focus',
            'hover:bg-profile-green-hover',
            'rounded-xl',
            'shadow-black',
            'sm:aspect-square',
            'sm:h-auto',
            'text-white',
            'transition-all'
          ],
          BUTTON_OUTLINE_CLASSES
        )}
      >
        {children}
        <p>{isActive && (isPerpetual ? 'ON' : timeLeft)}</p>
      </button>
    );
  }
);

StreamManagerActionButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default StreamManagerActionButton;
