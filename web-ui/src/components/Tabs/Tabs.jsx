import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import List from './List';
import Panel from './Panel';

const Tabs = ({ children, className }) => (
  <div className={clsm(['flex-col', 'flex', 'w-full', className])}>
    {children}
  </div>
);

Tabs.defaultProps = { className: '' };
Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

Tabs.List = List;
Tabs.Panel = Panel;

export default Tabs;
