import { useSearchParams } from 'react-router-dom';

import { SortType } from '@/types/files';

/**
 * Hook to manage FileManager query state using react-router-dom
 * Compatible with MemoryRouter used in KnowledgeRouter
 *
 * Returns query, sorter, and sortType state with setters
 */
export const useFileManagerQueryState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || null;
  const sorter = searchParams.get('sorter') || 'createdAt';
  const sortType = (searchParams.get('sortType') as SortType) || SortType.Desc;

  const setQuery = (value: string | null) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (!value) {
          newParams.delete('q');
        } else {
          newParams.set('q', value);
        }
        return newParams;
      },
      { replace: true },
    );
  };

  const setSorter = (value: string) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (value === 'createdAt') {
          newParams.delete('sorter');
        } else {
          newParams.set('sorter', value);
        }
        return newParams;
      },
      { replace: true },
    );
  };

  const setSortType = (value: SortType) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (value === SortType.Desc) {
          newParams.delete('sortType');
        } else {
          newParams.set('sortType', value);
        }
        return newParams;
      },
      { replace: true },
    );
  };

  return {
    query,
    setQuery,
    setSortType,
    setSorter,
    sortType,
    sorter,
  };
};
