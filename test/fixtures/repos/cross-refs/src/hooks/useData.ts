import { useState, useEffect } from 'react';
import type { DataState, DataItem } from '../types';

export function useData(): DataState {
  const [state, setState] = useState<DataState>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items: DataItem[] = [
          { id: 1, label: 'Alpha', value: 100 },
          { id: 2, label: 'Beta', value: 200 },
        ];
        setState({ items, loading: false, error: null });
      } catch (err) {
        setState({ items: [], loading: false, error: String(err) });
      }
    };
    fetchData();
  }, []);

  return state;
}
