import React, { memo, useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react';

// memo
export const PureButton = memo(function PureButton({ label }: { label: string }) {
  return <button>{label}</button>;
});
PureButton.displayName = 'PureButton';

// useMemo + useCallback pattern
export function ExpensiveList({ items }: { items: string[] }) {
  const sorted = useMemo(() => [...items].sort(), [items]);
  const onReset = useCallback(() => {}, []);
  return <ul>{sorted.map((s) => <li key={s}>{s}</li>)}</ul>;
}

// Custom hook with return tuple
export function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}

// Render props pattern
export function DataRenderer({ render }: { render: (data: string) => React.ReactNode }) {
  const data = 'hello';
  return <>{render(data)}</>;
}

// Context provider/consumer
interface Ctx { value: string; setValue: (v: string) => void }
const Ctx = createContext<Ctx>({ value: '', setValue: () => {} });
export function Provider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('');
  return <Ctx.Provider value={{ value, setValue }}>{children}</Ctx.Provider>;
}
export function useCtx() { return useContext(Ctx); }

// useEffect cleanup
export function CleanupExample() {
  useEffect(() => {
    const handler = () => {};
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return null;
}
