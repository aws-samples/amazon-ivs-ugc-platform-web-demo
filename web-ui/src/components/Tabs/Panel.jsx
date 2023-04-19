import PropTypes from 'prop-types';

import { clsm } from '../../utils';

const Panel = ({ children, index, selectedIndex }) => (
  <div
    className={clsm([
      'h-full',
      'w-full',
      selectedIndex === index ? 'flex' : 'hidden'
    ])}
  >
    {children}
  </div>
);

Panel.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  selectedIndex: PropTypes.number.isRequired
};

export default Panel;
