import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, STREAM_ACTION_NAME } from '../../../../constants';
import { BUTTON_OUTLINE_CLASSES } from '../../../../components/Button/ButtonTheme';
import { clsm, isTextColorInverted } from '../../../../utils';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import { useUser } from '../../../../contexts/User';
import useCountdown from '../../../../hooks/useCountdown';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';

const $content = $streamManagerContent.stream_manager_actions;
const PROGRESS_PIE_RADIUS = 14;
const PROGRESS_PIE_DIAMETER = PROGRESS_PIE_RADIUS * 2;
const STROKE_DASHARRAY_MAX = Math.round(PROGRESS_PIE_DIAMETER * Math.PI);
const DEFAULT_TRANSITION_CLASSES = [
  'duration-[0.15s]',
  'ease-in-out',
  'transition'
];

const StreamManagerActionButton = forwardRef(
  ({ ariaLabel, icon, label, name, onClick }, ref) => {
    const Icon = icon;
    const { hasPollEnded, savedPollData } = usePoll();
    const { hasFetchedInitialUserData, userData } = useUser();
    const { color = 'default' } = userData || {};
    const { currentBreakpoint } = useResponsiveDevice();
    const isSmallBreakpoint = currentBreakpoint < BREAKPOINTS.sm;
    const {
      activeStreamManagerActionData,
      stopStreamAction,
      endPollOnExpiry,
      cancelActivePoll
    } = useStreamManagerActions();

    let activeStreamManagerActionDuration;
    let activeStreamManagerActionName;
    let activeStreamManagerActionExpiry;

    if (name !== STREAM_ACTION_NAME.POLL) {
      const { duration, name, expiry } = activeStreamManagerActionData || {};

      activeStreamManagerActionDuration = duration;
      activeStreamManagerActionName = name;
      activeStreamManagerActionExpiry = expiry;
    } else {
      const { duration, name, expiry } =
        (savedPollData?.isActive && savedPollData) || {};

      activeStreamManagerActionDuration = duration;
      activeStreamManagerActionName = name;
      activeStreamManagerActionExpiry = expiry;
    }

    const isActive = name === activeStreamManagerActionName;
    const isPerpetual = isActive && !activeStreamManagerActionExpiry;
    const isCountingDown = isActive && !isPerpetual;

    const [textFormattedTimeLeft, currentProgress] = useCountdown({
      expiry: activeStreamManagerActionExpiry,
      formatter: (timeLeft) => [
        `${Math.ceil(timeLeft / 1000)}${$content.unit_seconds}`,
        (timeLeft / (activeStreamManagerActionDuration * 1000)) *
          STROKE_DASHARRAY_MAX
      ],
      isEnabled: isCountingDown,
      onExpiry:
        name === STREAM_ACTION_NAME.POLL && !hasPollEnded
          ? endPollOnExpiry
          : stopStreamAction
    });

    const handleClick = () => {
      if (isActive)
        name === STREAM_ACTION_NAME.POLL
          ? cancelActivePoll()
          : stopStreamAction();
      else onClick();
    };

    const currentLabel = (
      <>
        {!isActive && label.default}
        {isActive && !hasPollEnded && label.active}
        {isActive && hasPollEnded && $content.poll.showing_results}
        <br />
        {![STREAM_ACTION_NAME.AMAZON_PRODUCT, STREAM_ACTION_NAME.POLL].includes(
          name
        ) && `a ${name}`}
      </>
    );

    let statusLabel =
      isActive && (isPerpetual ? $content.on : textFormattedTimeLeft);

    if (!isActive) statusLabel = $content.off;

    const shouldInvertColors = isTextColorInverted(color);

    if (!hasFetchedInitialUserData) return null;

    return (
      <button
        data-testid={`stream-manager-${name}-action-button`}
        ref={ref}
        onClick={handleClick}
        aria-label={ariaLabel}
        className={clsm(
          [
            'dark:shadow-white',
            'focus:outline-none',
            'focus:shadow-focus',
            'group',
            'h-[148px]',
            'rounded-xl',
            'shadow-black',
            'sm:aspect-square',
            'sm:h-auto',
            'text-black',
            `bg-profile-${color}`,
            `hover:bg-profile-${color}-hover`
          ],
          BUTTON_OUTLINE_CLASSES,
          DEFAULT_TRANSITION_CLASSES,
          shouldInvertColors && 'text-white'
        )}
      >
        <div
          className={clsm([
            'flex-col',
            'flex',
            'space-y-2',
            'items-center',
            'justify-center',
            'mx-5',
            'md:mx-4',
            isSmallBreakpoint && 'space-y-0'
          ])}
        >
          {!isSmallBreakpoint && currentLabel && (
            <p className="min-h-[36px]">{currentLabel}</p>
          )}
          {icon && !isCountingDown && (
            <div
              className={clsm([
                'h-10',
                'p-2.5',
                'rounded-full',
                'w-10',
                `bg-profile-${color}-dark`,
                DEFAULT_TRANSITION_CLASSES,
                isActive && ['bg-black', shouldInvertColors && 'bg-white']
              ])}
            >
              <Icon
                className={clsm([
                  'fill-black',
                  'h-full',
                  'opacity-50',
                  'w-full',
                  DEFAULT_TRANSITION_CLASSES,
                  isActive && ['opacity-100', `fill-profile-${color}`],
                  !isActive && shouldInvertColors && 'fill-white'
                ])}
              />
            </div>
          )}
          {isCountingDown && (
            <div
              className={clsm([
                'p-1.5',
                'relative',
                'ring-2',
                'ring-black',
                'rounded-full',
                shouldInvertColors && 'ring-white'
              ])}
            >
              <svg
                className={clsm(['-rotate-90', 'h-7', 'rounded-full', 'w-7'])}
                viewBox={`0 0 ${PROGRESS_PIE_DIAMETER} ${PROGRESS_PIE_DIAMETER}`}
              >
                <circle
                  className={clsm([
                    'fill-black',
                    `group-hover:stroke-profile-${color}-hover`,
                    `stroke-profile-${color}`,
                    DEFAULT_TRANSITION_CLASSES,
                    shouldInvertColors && 'fill-white'
                  ])}
                  r={PROGRESS_PIE_RADIUS}
                  cx={PROGRESS_PIE_RADIUS}
                  cy={PROGRESS_PIE_RADIUS}
                  strokeWidth={PROGRESS_PIE_DIAMETER}
                  strokeDasharray={`${
                    STROKE_DASHARRAY_MAX - currentProgress
                  } ${STROKE_DASHARRAY_MAX}`}
                />
              </svg>
              {/* Hide aliasing on Chrome */}
              <div
                className={clsm([
                  'absolute',
                  'h-[26px]',
                  'left-[7px]',
                  'ring-2',
                  'rounded-full',
                  'top-[7px]',
                  'w-[26px]',
                  `group-hover:ring-profile-${color}-hover`,
                  `ring-profile-${color}`,
                  DEFAULT_TRANSITION_CLASSES
                ])}
              ></div>
            </div>
          )}
          <p
            className={clsm([
              'leading-4',
              'opacity-50',
              'text-[13px]',
              isActive && 'opacity-100'
            ])}
          >
            {!isSmallBreakpoint && statusLabel}
          </p>
        </div>
      </button>
    );
  }
);

StreamManagerActionButton.defaultProps = {
  icon: null,
  label: { default: '', active: '' }
};

StreamManagerActionButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  label: PropTypes.shape({
    default: PropTypes.string,
    active: PropTypes.string
  }),
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default StreamManagerActionButton;
