import PropTypes from 'prop-types';

import { clsm } from '../../utils';

const StaticNotification = ({ cta, message }) => (
  <div
    className={clsm([
      'bg-lightMode-gray-light',
      'dark:bg-darkMode-gray',
      'flex',
      'items-center',
      'justify-between',
      'mt-4',
      'p-8',
      'rounded-3xl',
      'sm:flex-col',
      'sm:p-8',
      'sm:space-x-0',
      'sm:space-y-5',
      'sm:w-full',
      'space-x-[90px]'
    ])}
  >
    <div
      className={clsm([
        'flex',
        'items-center',
        'max-w-[420px]',
        'sm:w-full',
        'space-y-4'
      ])}
    >
      <p className="text-p1">{message}</p>
    </div>
    {cta}
  </div>
);

StaticNotification.propTypes = {
  cta: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired
};

export default StaticNotification;
