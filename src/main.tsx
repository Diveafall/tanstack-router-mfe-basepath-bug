import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShellApp } from './shell-app';
import './styles.css';

// Register the MFE web component
import './mfe/mfe-element';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShellApp />
  </React.StrictMode>
);
