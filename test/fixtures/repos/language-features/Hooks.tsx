import { useState, useEffect, useMemo, useCallback, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, forwardRef, createContext } from 'react';

const ThemeContext = createContext('light');

export function useTheme() {
  return useContext(ThemeContext);
}

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const doubled = useMemo(() => count * 2, [count]);
  return [count, increment, doubled] as const;
}

function reducer(state: number, action: 'inc' | 'dec') {
  switch (action) {
    case 'inc': return state + 1;
    case 'dec': return state - 1;
  }
}

export function Timer() {
  const [state, dispatch] = useReducer(reducer, 0);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.color = 'red';
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => dispatch('inc'), 1000);
    return () => clearInterval(id);
  }, []);

  return <div ref={ref}>{state}</div>;
}

export interface Handle {
  reset: () => void;
}

export const FancyInput = forwardRef<Handle, {}>((_props, ref) => {
  useImperativeHandle(ref, () => ({ reset: () => {} }), []);
  return <input />;
});
