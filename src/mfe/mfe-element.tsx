import React from 'react';
import ReactDOM from 'react-dom/client';
import { MfeApp } from './mfe-app';

/**
 * MFE Web Component
 *
 * This custom element wraps a React application with its own TanStack Router.
 * The MFE router is configured with basepath: '/mfe' and uses hash history.
 *
 * BUG: When the shell navigates to a path outside '/mfe' (e.g., '/settings'),
 * this MFE's router still receives the history event and tries to match it,
 * resulting in a 404 error from the MFE instead of the shell handling it.
 */
class MfeElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    // Create a shadow DOM for style isolation (optional)
    const mountPoint = document.createElement('div');
    this.appendChild(mountPoint);

    // Create React root and render MFE app
    this.root = ReactDOM.createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <MfeApp />
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    // Clean up React root when element is removed
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

// Register the custom element
customElements.define('mfe-app', MfeElement);
