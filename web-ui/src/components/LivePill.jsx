import PropTypes from 'prop-types';

import { app as $content } from '../content';
import { clsm } from '../utils';

const LivePill = ({ className }) => (
  <div
    className={clsm([
      'bg-lightMode-red',
      'dark:bg-darkMode-red',
      'flex',
      'font-bold',
      'h-5',
      'items-center',
      'justify-center',
      'rounded-3xl',
      'text-[10px]',
      'text-white',
      'uppercase',
      'w-10',
      'leading-3',
      className
    ])}
  >
    {$content.live}
  </div>
);

LivePill.propTypes = {
  className: PropTypes.string
};

LivePill.defaultProps = {
  className: ''
};

export default LivePill;
