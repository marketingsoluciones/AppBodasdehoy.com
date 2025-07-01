import React from 'react';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface CosteTotalCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
  formatNumber: (value: number) => string;
}

export const CosteTotalCell: React.FC<CosteTotalCellProps> = ({ 
  row, 
  onRowChange, 
  formatNumber 
}) => {
  if (row.type === 'expense' && row.isEditable) {
    // Gasto sin items - editable
    const mockInfo = {
      row: {
        original: {
          object: row.object,
          categoriaID: row.categoriaID,
          gastoID: row.gastoID,
          _id: row.gastoID
        }
      }
    };

    return (
      <div className="flex justify-end">
        <EditableLabelWithInput
          accessor="coste_final"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type="float"
          value={row.total}
          textAlign="end"
          isLabelDisabled
        />
      </div>
    );
  } else {
    // Categoría, gasto con items, o item - solo lectura
    return (
      <span className="text-right block w-full pr-2">
        {formatNumber(row.total)}
      </span>
    );
  }
};