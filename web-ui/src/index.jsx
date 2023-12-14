import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';

import './index.css';
import { noop, connectToAppSyncGraphQlApi } from './utils';
import { RESTRICTED_PROD_CONSOLE_TYPES } from './constants';
import App from './App';

connectToAppSyncGraphQlApi();

const container = document.getElementById('root');
const root = ReactDOMClient.createRoot(container);

// Disable restricted console types in the production environment
if (process.env.REACT_APP_STAGE === 'prod') {
  for (const type of RESTRICTED_PROD_CONSOLE_TYPES) {
    console[type] = noop;
  }
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
