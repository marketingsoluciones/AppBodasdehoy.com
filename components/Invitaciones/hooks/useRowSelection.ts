import { useEffect, useState } from 'react';
import { DataTableGroupContextProvider } from '../../../context/DataTableGroupContext';

interface UseRowSelectionReturn {
  selectedData: {
    arrIDs: string[] | undefined;
    getToggleAllRowsSelectedProps: any;
  };
  setSelectedData: (data: any) => void;
}

export const useRowSelection = (): UseRowSelectionReturn => {
  const [selectedData, setSelectedData] = useState({
    arrIDs: undefined,
    getToggleAllRowsSelectedProps: undefined
  });

  return {
    selectedData,
    setSelectedData
  };
};

export const useRowSelectionCell = (row: any, multiSeled: boolean) => {
  const { dispatch, dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

  useEffect(() => {
    const id = row?.original?._id;
    if (row.isSelected && !arrIDs.includes(id)) {
      dispatch({ type: "ADD_ROW_SELECTED", payload: id });
    }
    if (!row.isSelected && arrIDs.includes(id)) {
      dispatch({ type: "REMOVE_ROW_SELECTED", payload: id });
    }
  }, [row.isSelected, row, dispatch, arrIDs]);

  return { multiSeled };
}; 