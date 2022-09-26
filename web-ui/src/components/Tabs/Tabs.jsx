import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import List from './List';
import Panel from './Panel';

const Tabs = ({ children }) => (
  <div className={clsm(['flex-col', 'flex', 'w-full'])}>{children}</div>
);

Tabs.propTypes = { children: PropTypes.node.isRequired };

Tabs.List = List;
Tabs.Panel = Panel;

export default Tabs;
