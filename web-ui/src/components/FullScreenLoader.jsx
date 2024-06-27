import PropTypes from 'prop-types';

import { app as $content } from '../content';
import { BREAKPOINTS } from '../constants';
import { clsm, noop } from '../utils';
import { SyncError } from '../assets/icons';
import Button from './Button';
import Spinner from './Spinner';

const FullScreenLoader = ({
  hasError = false,
  mobileBreakpoint = BREAKPOINTS.md,
  onClick = noop
}) =>
  hasError ? (
    <div
      className={clsm([
        'absolute',
        'top-[calc(50%_+_42px_-_15px)]',
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'left-1/2',
        '-translate-x-1/2',
        '-translate-y-1/2',
        '[&>svg]:w-12',
        '[&>svg]:h-12',
        '[&>svg]:fill-lightMode-gray-dark',
        'dark:[&>svg]:fill-white'
      ])}
    >
      <SyncError />
      <h2 className={clsm(['mb-4', 'text-center'])}>
        {$content.full_screen_loader.error_occurred}
      </h2>
      <Button
        className={clsm(['text-lightMode-blue', 'dark:text-darkMode-blue'])}
        onClick={onClick}
        variant="secondaryText"
      >
        {$content.full_screen_loader.try_again}
      </Button>
    </div>
  ) : (
    <div
      className={clsm([
        'relative',
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'h-screen'
      ])}
    >
      <Spinner size="large" variant="light" />
    </div>
  );

FullScreenLoader.propTypes = {
  hasError: PropTypes.bool,
  mobileBreakpoint: PropTypes.oneOf(Object.values(BREAKPOINTS)),
  onClick: PropTypes.func
};

export default FullScreenLoader;
