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
   - Click **"MFE Page 1"** or **"MFE Page 2"** (MFE loads correctly)
   - Click **"Settings"** in the shell navigation
   - **BUG**: You'll see "404 - Not Found in MFE" instead of the shell's Settings page

## Expected vs Actual Behavior

### Expected
When navigating to `/settings` (outside the MFE's basepath `/mfe`):
- MFE router should **ignore** the history event (path is out of scope)
- Shell router should handle `/settings` and render the Settings page

### Actual (Bug)
When navigating to `/settings`:
- MFE router **processes** the history event
- MFE router tries to match `/settings` against its routes
- No match → MFE's `defaultNotFoundComponent` renders
- Shell's Settings page never appears

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
