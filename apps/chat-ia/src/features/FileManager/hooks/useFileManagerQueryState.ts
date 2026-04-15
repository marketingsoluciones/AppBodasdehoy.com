import { useCallback, useEffect, useState } from 'react';

import { SortType } from '@/types/files';

/**
 * Hook to manage FileManager query/sort state.
 *
 * Uses local React state instead of router-specific hooks so it works in both:
 * - Next.js App Router pages (/files)
 * - react-router-dom MemoryRouter (/knowledge)
 *
 * Initializes from the current URL search params on mount.
 */
export const useFileManagerQueryState = () => {
  const [query, setQueryState] = useState<string | null>(null);
  const [sorter, setSorterState] = useState('createdAt');
  const [sortType, setSortTypeState] = useState<SortType>(SortType.Desc);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const s = params.get('sorter');
    const st = params.get('sortType') as SortType | null;
    if (q) setQueryState(q);
    if (s) setSorterState(s);
    if (st) setSortTypeState(st);
  }, []);

  const setQuery = useCallback((value: string | null) => {
    setQueryState(value);
  }, []);

  const setSorter = useCallback((value: string) => {
    setSorterState(value);
  }, []);

  const setSortType = useCallback((value: SortType) => {
    setSortTypeState(value);
  }, []);

  return {
    query,
    setQuery,
    setSortType,
    setSorter,
    sortType,
    sorter,
  };
};
