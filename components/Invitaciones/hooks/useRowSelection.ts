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
  const { dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();
  const [selectedData, setSelectedData] = useState({
    arrIDs: arrIDs,
    getToggleAllRowsSelectedProps: undefined
  });

  // Actualizar el estado cuando cambie el contexto
  useEffect(() => {
    setSelectedData(prev => ({
      ...prev,
      arrIDs: arrIDs
    }));
  }, [arrIDs]);

  return {
    selectedData,
    setSelectedData
  };
};

export const useRowSelectionCell = (row: any, multiSeled: boolean) => {
  const { dispatch, dataTableGroup: { arrIDs } } = DataTableGroupContextProvider();

  useEffect(() => {
    if (!multiSeled) return;

    const id = row?.original?._id;
    if (!id) return;

    // Verificar si el estado actual es diferente al esperado
    const isCurrentlySelected = arrIDs.includes(id);
    const shouldBeSelected = row.isSelected;

    if (shouldBeSelected && !isCurrentlySelected) {
      dispatch({ type: "ADD_ROW_SELECTED", payload: id });
    } else if (!shouldBeSelected && isCurrentlySelected) {
      dispatch({ type: "REMOVE_ROW_SELECTED", payload: id });
    }
  }, [row.isSelected, row?.original?._id, dispatch, arrIDs, multiSeled]);

  return { multiSeled };
}; 