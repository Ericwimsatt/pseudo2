import { createContext } from 'react';

export const SearchContext = createContext<{ term: string; isActiveMatch: boolean }>({ term: '', isActiveMatch: false });
