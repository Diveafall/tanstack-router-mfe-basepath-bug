import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

// Shell Root Layout
const shellRootRoute = createRootRoute({
  component: () => (
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
          Current URL: <strong>{window.location.hash || '#/'}</strong>
        </div>
        <Outlet />
      </div>
    </div>
  ),
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
        Click on <strong>"MFE Page 1"</strong> or <strong>"MFE Page 2"</strong>{' '}
        to load the MFE, then click <strong>"Settings"</strong> to see the bug.
      </p>
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
        <strong>If you see this page correctly</strong>, the bug is NOT
        occurring.
      </p>
      <p>
        <strong>If you see "404 - Not Found in MFE"</strong>, the bug IS
        occurring.
      </p>
    </div>
  ),
});

// MFE Container Route - renders the MFE web component
const mfeRoute = createRoute({
  getParentRoute: () => shellRootRoute,
  path: '/mfe/$',
  component: () => {
    // Render the MFE web component
    // The MFE has its own TanStack Router with basepath: '/mfe'
    return (
      <div className="page">
        <h2>MFE Container (Shell)</h2>
        <p>The shell is rendering the MFE web component below:</p>
        {/* @ts-expect-error - custom element */}
        <mfe-app />
      </div>
    );
  },
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
