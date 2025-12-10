import { useEffect, useState } from 'react';
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

/**
 * IMPORTANT: To demonstrate the bug, the MFE must stay mounted even when
 * navigating to shell routes. This simulates real MFE architectures where:
 *
 * 1. The MFE is loaded once and stays in the DOM
 * 2. The shell controls the URL via hash history
 * 3. Both routers subscribe to the same hash changes
 *
 * The bug: When shell navigates to /settings, the MFE router (with basepath: /mfe)
 * still receives the history event and tries to match /settings, showing 404.
 */

// Track if MFE has been loaded at least once
let mfeHasBeenLoaded = false;

// Shell Root Layout
const shellRootRoute = createRootRoute({
  component: () => {
    const [hash, setHash] = useState(window.location.hash || '#/');

    useEffect(() => {
      const updateHash = () => setHash(window.location.hash || '#/');
      window.addEventListener('hashchange', updateHash);
      return () => window.removeEventListener('hashchange', updateHash);
    }, []);

    // Check if we're on an MFE route
    const isOnMfeRoute = hash.startsWith('#/mfe');

    // Once MFE is loaded, keep it mounted to demonstrate the bug
    if (isOnMfeRoute) {
      mfeHasBeenLoaded = true;
    }

    return (
      <div className="shell-app">
        <div className="shell-header">
          <h1>Shell Application (TanStack Router)</h1>
          <nav className="shell-nav">
            <Link to="/">Home</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/mfe/page1">MFE Page 1</Link>
            <Link to="/mfe/page2">MFE Page 2</Link>
          </nav>
        </div>
        <div className="shell-content">
          <div className="current-url">
            Current URL: <strong>{hash}</strong>
          </div>

          {/* Shell content area */}
          <Outlet />

          {/*
            MFE stays mounted after first load to demonstrate the bug.
            In real MFE architectures, the MFE container often persists.
          */}
          {mfeHasBeenLoaded && (
            <div style={{
              marginTop: '20px',
              display: isOnMfeRoute ? 'block' : 'block' // Always visible once loaded
            }}>
              {!isOnMfeRoute && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}>
                  <strong>Note:</strong> MFE is still mounted below (simulating persistent MFE container).
                  Watch what happens to it when you navigate to shell routes!
                </div>
              )}
              {/* @ts-expect-error - custom element */}
              <mfe-app />
            </div>
          )}
        </div>
      </div>
    );
  },
});

// Shell Home Page
const homeRoute = createRoute({
  getParentRoute: () => shellRootRoute,
  path: '/',
  component: () => (
    <div className="page">
      <h2>Home Page (Shell)</h2>
      <p>This is the shell application's home page.</p>
      <p>
        <strong>To reproduce the bug:</strong>
      </p>
      <ol>
        <li>Click <strong>"MFE Page 1"</strong> to load the MFE</li>
        <li>Then click <strong>"Settings"</strong> or <strong>"Home"</strong></li>
        <li>Observe the MFE showing "404 - Not Found" below</li>
      </ol>
    </div>
  ),
});

// Shell Settings Page
const settingsRoute = createRoute({
  getParentRoute: () => shellRootRoute,
  path: '/settings',
  component: () => (
    <div className="page">
      <h2>Settings Page (Shell)</h2>
      <p>This is the shell application's settings page.</p>
      <p>
        Look at the MFE container below - it's showing a 404 error because
        the MFE router is trying to match <code>/settings</code> even though
        its basepath is <code>/mfe</code>.
      </p>
    </div>
  ),
});

// MFE placeholder route (actual MFE is rendered in root layout)
const mfeRoute = createRoute({
  getParentRoute: () => shellRootRoute,
  path: '/mfe/$',
  component: () => null, // MFE is rendered in root layout
});

// Create Shell Route Tree
const shellRouteTree = shellRootRoute.addChildren([
  homeRoute,
  settingsRoute,
  mfeRoute,
]);

// Create Shell Router with Hash History
const shellRouter = createRouter({
  routeTree: shellRouteTree,
  history: createHashHistory(),
});

// Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof shellRouter;
  }
}

export function ShellApp() {
  return <RouterProvider router={shellRouter} />;
}
