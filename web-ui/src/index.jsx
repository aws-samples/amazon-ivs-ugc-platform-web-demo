import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';

import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = ReactDOMClient.createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
