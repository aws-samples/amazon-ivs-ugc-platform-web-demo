import { StrictMode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import * as ReactDOMClient from 'react-dom/client';

import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = ReactDOMClient.createRoot(container);

root.render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
