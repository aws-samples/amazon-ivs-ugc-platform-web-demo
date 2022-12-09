import PropTypes from 'prop-types';

import { clsm } from '../../utils';

const NoImageSrcIcon = ({ shape, className }) => (
  <div
    className={clsm([
      'before:absolute',
      'before:h-full',
      'before:top-1/2',
      'before:left-1/2',
      'before:-translate-x-1/2',
      'before:-translate-y-1/2',
      'before:bg-lightMode-gray-extraLight',
      'dark:before:bg-darkMode-gray',
      shape === 'round' && ['before:aspect-square', 'before:rounded-full'],
      shape === '16/9' && ['before:aspect-video', 'before:rounded-xl'],
      className
    ])}
  />
);

NoImageSrcIcon.propTypes = {
  className: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string
  ]),
  shape: PropTypes.oneOf(['round', '16/9'])
};

NoImageSrcIcon.defaultProps = { className: '', shape: 'round' };

export default NoImageSrcIcon;
