import React from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../utils';
import withPortal from './withPortal';

const Debug = ({ data }) => (
  <pre
    className={clsm([
      'bg-black',
      'fixed',
      'flex-col',
      'flex',
      'text-white',
      'top-0',
      'p-8',
      'rounded-xl',
      'z-[9999]'
    ])}
  >
    {JSON.stringify(data, null, 2)}
  </pre>
);

Debug.propTypes = { data: PropTypes.object.isRequired };

export default withPortal(Debug, 'debug');
