# TanStack Router MFE Basepath Bug Reproduction

This repository demonstrates a bug in TanStack Router where a router configured with a `basepath` still responds to history events for paths **outside** its basepath scope.

## The Bug

When multiple TanStack Routers coexist (e.g., in micro-frontend architectures), **all routers respond to all history changes**, even when the path is outside their configured `basepath`. This causes:

- 404 errors from the wrong router
- `defaultNotFoundComponent` triggering incorrectly
- Broken navigation between shell and MFE modules

## Architecture

```
Shell Application (TanStack Router, hash history)
├── / (home)
├── /settings
└── /mfe/* (splat route → loads MFE web component)

MFE Application (TanStack Router, hash history, basepath: '/mfe')
├── /mfe/page1
└── /mfe/page2
```

**Key detail**: In this reproduction, the MFE stays mounted even when navigating to shell routes. This simulates real MFE architectures where:
1. The MFE is loaded once and stays in the DOM (persistent container)
2. The shell controls the URL via hash history
3. Both routers subscribe to the same hash changes

## Steps to Reproduce

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

4. **Trigger the bug:**
   - Click **"MFE Page 1"** to load the MFE (it works correctly)
   - Click **"Settings"** or **"Home"** in the shell navigation
   - **BUG**: The MFE container below shows "404 - Not Found in MFE"

The MFE should **ignore** the `/settings` or `/` routes because they're outside its basepath (`/mfe`), but instead it tries to match them and fails.

## Expected vs Actual Behavior

### Expected
When navigating to `/settings` (outside the MFE's basepath `/mfe`):
- MFE router should **ignore** the history event (path is out of scope)
- MFE should continue showing its last valid state, or show nothing

### Actual (Bug)
When navigating to `/settings`:
- MFE router **processes** the history event
- MFE router tries to match `/settings` against its routes
- No match → MFE's `defaultNotFoundComponent` renders "404 - Not Found"

## Root Cause

In `@tanstack/react-router`, the `Transitioner.tsx` component subscribes to history changes:

```typescript
// packages/react-router/src/Transitioner.tsx:44
router.history.subscribe(router.load)
```

This subscription does **not** filter by basepath. Every router receives every history event, regardless of whether the path is within its basepath scope.

## How React Router Handles This

React Router uses a `stripBasename` function that returns `null` for paths outside the basename scope:

```typescript
// @remix-run/router
export function stripBasename(pathname: string, basename: string): string | null {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;  // Path outside basename scope - IGNORE
  }
  // ...
}
```

When `stripBasename()` returns `null`:
- `matchRoutes()` returns `null`
- Nothing renders - the router completely ignores out-of-scope paths

## Proposed Fix

Add a basepath scope check at the beginning of the router's `load` method:

```typescript
// router.ts
load = async (opts) => {
  // If this router has a basepath, only respond to paths within scope
  if (this.basepath && this.basepath !== '/') {
    const pathToCheck = /* extract path from history */;
    if (!isPathInScope(pathToCheck, this.basepath)) {
      return; // Silent ignore - let other routers handle it
    }
  }
  // ... rest of load logic
}
```

See PR: https://github.com/TanStack/router/pull/6063

## Related Issues

- [Discussion #2103: Multiple routers in different packages](https://github.com/TanStack/router/discussions/2103)
- [Discussion #2108: MFE "not found" issue](https://github.com/TanStack/router/discussions/2108)
- [Issue #6064: Bug report](https://github.com/TanStack/router/issues/6064)
