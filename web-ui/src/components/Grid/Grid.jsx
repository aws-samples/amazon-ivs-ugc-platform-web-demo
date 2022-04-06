import React from 'react';
import PropTypes from 'prop-types';

import './Grid.css';

const Grid = ({ children: columns, reverse }) => {
  let classList = ['grid'];

  if (reverse) classList.push('reverse');

  return <div className={classList.join(' ')}>{columns}</div>;
};

const GridItem = ({ type, children, autoFit }) => {
  let classList = ['flex'];

  if (type === 'row') classList.push('grid-row');
  if (type === 'col') classList.push('grid-col');

  if (autoFit) classList.push('autoFit');

  return <div className={classList.join(' ')}>{children}</div>;
};

Grid.Col = (props) => <GridItem type="col" {...props} />;
Grid.Row = (props) => <GridItem type="row" {...props} />;

Grid.propTypes = {
  children: PropTypes.node.isRequired,
  reverse: PropTypes.bool
};

Grid.defaultProps = { reverse: false, scrollable: false };

GridItem.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['row', 'col']).isRequired,
  autoFit: PropTypes.bool
};

GridItem.defaultProps = { autoFit: false, scrollable: false };

export default Grid;
