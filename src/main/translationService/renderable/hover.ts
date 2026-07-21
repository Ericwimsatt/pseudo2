import type { HoverContent } from './types';

export function buildHover(
  title: string,
  body?: string,
  metadata?: Record<string, unknown>
): HoverContent {
  const h: HoverContent = { title };
  if (body) h.body = body;
  if (metadata) h.metadata = metadata;
  return h;
}

export function formatMetadata(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return '';
  const lines: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'object') {
      const nested = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (nested) lines.push(`${key}: ${nested}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

interface HookTooltip {
  name: string;
  title: string;
  body: string;
}

const HOOK_TOOLTIPS: Record<string, HookTooltip> = {
  useState: {
    name: 'useState',
    title: 'useState(initialState)',
    body: 'Declares a state variable in a function component. Returns [value, setter]. React preserves the value between re-renders. Use for any data that changes over time (form inputs, toggles, counters, etc.).\n\nDocs: https://react.dev/reference/react/useState',
  },
  useEffect: {
    name: 'useEffect',
    title: 'useEffect(setup, dependencies?)',
    body: 'Synchronizes a component with an external system (API calls, subscriptions, DOM manipulation). Runs after the component renders. The cleanup function runs before the next effect or on unmount. Pass an empty dependency array [] to run only on mount.\n\nDocs: https://react.dev/reference/react/useEffect',
  },
  useContext: {
    name: 'useContext',
    title: 'useContext(SomeContext)',
    body: 'Reads and subscribes to a React context value. Lets a component access data provided by a parent <Context.Provider> without prop drilling. Re-renders when the context value changes.\n\nDocs: https://react.dev/reference/react/useContext',
  },
  useRef: {
    name: 'useRef',
    title: 'useRef(initialValue)',
    body: 'Returns a mutable ref object whose .current property persists across renders. Updating .current does not trigger a re-render. Commonly used for: (1) referencing DOM elements, (2) storing mutable values like timers/IDs, (3) keeping previous values for comparison.\n\nDocs: https://react.dev/reference/react/useRef',
  },
  useCallback: {
    name: 'useCallback',
    title: 'useCallback(fn, dependencies)',
    body: 'Caches a function definition between re-renders. Returns a memoized callback that only changes if its dependencies change. Use when passing callbacks to optimized child components (React.memo) or as dependencies of other hooks.\n\nDocs: https://react.dev/reference/react/useCallback',
  },
  useMemo: {
    name: 'useMemo',
    title: 'useMemo(calculateFn, dependencies)',
    body: 'Caches the result of an expensive computation between re-renders. Only recalculates when dependencies change. Use for expensive calculations, derived data, or preserving reference equality across renders. Do not use for side effects or as a performance guarantee.\n\nDocs: https://react.dev/reference/react/useMemo',
  },
  useReducer: {
    name: 'useReducer',
    title: 'useReducer(reducer, initialArg, init?)',
    body: 'Alternative to useState for complex state logic involving multiple sub-values or state transitions. Accepts a reducer function (state, action) => newState. Useful when the next state depends on the previous state in non-trivial ways.\n\nDocs: https://react.dev/reference/react/useReducer',
  },
  useLayoutEffect: {
    name: 'useLayoutEffect',
    title: 'useLayoutEffect(setup, dependencies?)',
    body: 'Like useEffect, but fires synchronously after all DOM mutations and before the browser paints. Used for reading/writing layout measurements (scroll position, element dimensions) that must be applied before the visual update. Prefer useEffect unless you need synchronous execution.\n\nDocs: https://react.dev/reference/react/useLayoutEffect',
  },
  useImperativeHandle: {
    name: 'useImperativeHandle',
    title: 'useImperativeHandle(ref, createHandle, dependencies?)',
    body: 'Customizes the instance value exposed to parent components when using refs. Used with forwardRef to control what a parent can access on a child component. Useful for exposing imperative methods (focus, scrollTo, etc.) while keeping internal state private.\n\nDocs: https://react.dev/reference/react/useImperativeHandle',
  },
  useDebugValue: {
    name: 'useDebugValue',
    title: 'useDebugValue(value, format?)',
    body: 'Adds a label to a custom hook in React DevTools. Helps identify and debug custom hooks in the component inspector. The optional format function only runs when DevTools inspects the hook, avoiding overhead.\n\nDocs: https://react.dev/reference/react/useDebugValue',
  },
  useId: {
    name: 'useId',
    title: 'useId()',
    body: 'Generates a unique, stable ID string for accessibility attributes (aria-describedby, htmlFor). Returns the same ID across server and client renders, avoiding hydration mismatches. Do not use as a key in lists.\n\nDocs: https://react.dev/reference/react/useId',
  },
  useTransition: {
    name: 'useTransition',
    title: 'useTransition()',
    body: 'Returns [isPending, startTransition]. Marks a state update as non-urgent, allowing React to keep the UI responsive during the transition. The isPending flag indicates the background work is still in progress. Use for slow computations that should not block user input.\n\nDocs: https://react.dev/reference/react/useTransition',
  },
  useDeferredValue: {
    name: 'useDeferredValue',
    title: 'useDeferredValue(value)',
    body: 'Defers updating a value that depends on urgent state. Shows the old value until a more important update completes. Useful in controlled inputs where a downstream component performs expensive work on each keystroke. Similar to debouncing but without a fixed delay.\n\nDocs: https://react.dev/reference/react/useDeferredValue',
  },
  useSyncExternalStore: {
    name: 'useSyncExternalStore',
    title: 'useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)',
    body: 'Subscribes a component to an external mutable store (Redux, Zustand, browser APIs). Ensures consistent reads even during concurrent rendering and avoids tearing. The recommended way to integrate external stores into React components.\n\nDocs: https://react.dev/reference/react/useSyncExternalStore',
  },
  useInsertionEffect: {
    name: 'useInsertionEffect',
    title: 'useInsertionEffect(setup, dependencies?)',
    body: 'Fires synchronously before any layout effects, specifically for CSS-in-JS libraries to inject styles before the browser paints. Should only be used by library authors; prefer useEffect or useLayoutEffect for application code.\n\nDocs: https://react.dev/reference/react/useInsertionEffect',
  },
  createContext: {
    name: 'createContext',
    title: 'createContext(defaultValue)',
    body: 'Creates a Context object for passing data through the component tree without props. Components below a matching <Context.Provider> can read the value via useContext. When there is no matching provider, returns defaultValue.\n\nDocs: https://react.dev/reference/react/createContext',
  },
  forwardRef: {
    name: 'forwardRef',
    title: 'forwardRef(render)',
    body: 'Forwards a parent ref through a component to one of its children. The render function receives props and ref as arguments. Commonly used to expose DOM access on reusable components (inputs, buttons) while keeping the component API simple.\n\nDocs: https://react.dev/reference/react/forwardRef',
  },
  memo: {
    name: 'memo',
    title: 'memo(Component, arePropsEqual?)',
    body: 'Memoizes a component to skip re-rendering when its props have not changed (shallow comparison by default). Useful for components that render large subtrees or are frequently re-rendered with identical props. Provide a custom arePropsEqual for deep comparison.\n\nDocs: https://react.dev/reference/react/memo',
  },
  lazy: {
    name: 'lazy',
    title: 'lazy(loadFn)',
    body: 'Enables code-splitting by deferring a component load until it is first rendered. The load function must return a promise resolving to a default-exported React component. Rendered components must be wrapped in <Suspense> to show a fallback while loading.\n\nDocs: https://react.dev/reference/react/lazy',
  },
  Suspense: {
    name: 'Suspense',
    title: '<Suspense fallback={...}>',
    body: 'Displays a fallback UI while its children are loading (lazy components, data fetching with React Server Components, or resource loading). Enables streaming server rendering and partial hydration. Nest multiple Suspense boundaries for granular loading states.\n\nDocs: https://react.dev/reference/react/Suspense',
  },
  createPortal: {
    name: 'createPortal',
    title: 'createPortal(children, domNode, key?)',
    body: 'Renders a React subtree into a different DOM node outside the current component hierarchy. Often used for modals, tooltips, and dropdowns that need to escape CSS overflow or z-index constraints. Events still bubble through the React tree.\n\nDocs: https://react.dev/reference/react-dom/createPortal',
  },
  flushSync: {
    name: 'flushSync',
    title: 'flushSync(callback)',
    body: 'Forces React to flush pending state updates synchronously inside the callback. Bypasses batching for cases where you need immediate DOM access after a state change (e.g., scrolling to a newly added list item). Use sparingly; defer to normal batching in most cases.\n\nDocs: https://react.dev/reference/react-dom/flushSync',
  },
};

export function getReactHookTooltip(name: string): HoverContent | null {
  const hook = HOOK_TOOLTIPS[name];
  if (!hook) return null;
  return buildHover(hook.title, hook.body);
}

const KEYWORD_TOOLTIPS: Record<string, string> = {
  export: "The 'export' keyword makes the declared value available to other modules via import. Other files can import the exported value to reuse it.",
};

export function getKeywordTooltip(name: string): HoverContent | null {
  const body = KEYWORD_TOOLTIPS[name];
  if (!body) return null;
  return buildHover(name, body);
}
