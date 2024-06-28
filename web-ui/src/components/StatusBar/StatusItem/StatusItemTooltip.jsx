import PropTypes from 'prop-types';

import Tooltip from '../../Tooltip';

const StatusItemTooltip = ({ children, text }) =>
  text ? (
    <Tooltip message={text} translate={{ y: -2 }}>
      {children}
    </Tooltip>
  ) : (
    children
  );

StatusItemTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.string
};

StatusItemTooltip.defaultProps = { text: '' };

export default StatusItemTooltip;
