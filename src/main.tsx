import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './router';
import './index.css';
import { initDB } from './db';
import './registerSW';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

initDB().catch((err) => {
  console.error('Failed to initialize database', err);
});
