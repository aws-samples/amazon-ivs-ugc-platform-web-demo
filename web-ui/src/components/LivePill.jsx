import PropTypes from 'prop-types';

import { app as $content } from '../content';
import { clsm } from '../utils';

const LivePill = ({ className }) => (
  <div
    className={clsm([
      'bg-lightMode-red',
      'dark:bg-darkMode-red',
      'font-bold',
      'leading-3',
      'px-2',
      'py-1',
      'rounded-3xl',
      'text-[10px]',
      'text-white',
      'uppercase',
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
