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
 * MFE Application with its own TanStack Router
 *
 * Configuration:
 * - Uses createHashHistory() (same as shell)
 * - basepath: '/mfe' (should only handle paths starting with /mfe)
 *
 * BUG EXPLANATION:
 * When the shell navigates to '/settings' (outside /mfe scope),
 * this MFE router still processes the history change because
 * router.history.subscribe(router.load) in Transitioner.tsx
 * does NOT filter by basepath.
 *
 * EXPECTED: MFE router ignores '/settings' (outside its basepath)
 * ACTUAL: MFE router tries to match '/settings', triggers 404
 */

// MFE Root Layout
const mfeRootRoute = createRootRoute({
  component: () => (
    <div className="mfe-container">
      <div className="mfe-header">
        <h3>MFE Application (basepath: /mfe)</h3>
        <nav className="mfe-nav">
          <Link to="/page1">Page 1</Link>
          <Link to="/page2">Page 2</Link>
        </nav>
      </div>
      <div className="mfe-content">
        <Outlet />
      </div>
    </div>
  ),
  // This is the bug! When shell navigates to /settings,
  // this MFE's notFoundComponent renders instead of shell handling it
  notFoundComponent: () => <MfeNotFound />,
});

// MFE 404 Component - This should NOT appear when navigating to shell routes
function MfeNotFound() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  return (
    <div className="mfe-404">
      <h3>404 - Not Found in MFE</h3>
      <p>The MFE router could not match the current path.</p>
      <p>
        Current hash: <code>{hash}</code>
      </p>
      <div className="bug-indicator">
        BUG! This MFE should NOT be trying to match paths outside its basepath
        (/mfe).
        <br />
        The shell should be handling this route, not the MFE.
      </div>
    </div>
  );
}

// MFE Page 1
const mfePage1Route = createRoute({
  getParentRoute: () => mfeRootRoute,
  path: '/page1',
  component: () => (
    <div>
      <h4>MFE Page 1</h4>
      <p>This is page 1 inside the MFE.</p>
      <p>
        Now try clicking <strong>"Settings"</strong> in the shell navigation
        above.
      </p>
      <p>
        <strong>Expected:</strong> Shell's Settings page should render.
      </p>
      <p>
        <strong>Actual (BUG):</strong> MFE shows "404 - Not Found in MFE".
      </p>
    </div>
  ),
});

// MFE Page 2
const mfePage2Route = createRoute({
  getParentRoute: () => mfeRootRoute,
  path: '/page2',
  component: () => (
    <div>
      <h4>MFE Page 2</h4>
      <p>This is page 2 inside the MFE.</p>
      <p>
        Try navigating to <strong>"Settings"</strong> or <strong>"Home"</strong>{' '}
        to see the bug.
      </p>
    </div>
  ),
});

// Create MFE Route Tree
const mfeRouteTree = mfeRootRoute.addChildren([mfePage1Route, mfePage2Route]);

// Create MFE Router with Hash History and basepath
const mfeRouter = createRouter({
  routeTree: mfeRouteTree,
  history: createHashHistory(),
  basepath: '/mfe', // <-- This should scope the router to /mfe/* paths only
  defaultNotFoundComponent: MfeNotFound,
});

export function MfeApp() {
  return <RouterProvider router={mfeRouter} />;
}
