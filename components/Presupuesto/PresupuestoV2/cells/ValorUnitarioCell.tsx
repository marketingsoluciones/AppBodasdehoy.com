import React from 'react';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface ValorUnitarioCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
  formatNumber: (value: number) => string;
}

export const ValorUnitarioCell: React.FC<ValorUnitarioCellProps> = ({ 
  row, 
  onRowChange, 
  formatNumber 
}) => {
  if (row.type === 'item' && typeof row.valorUnitario === 'number') {
    const mockInfo = {
      row: {
        original: {
          object: row.object,
          categoriaID: row.categoriaID,
          gastoID: row.gastoID,
          itemID: row.itemID,
          _id: row.itemID
        }
      }
    };

    return (
      <div className="flex justify-end">
        <EditableLabelWithInput
          accessor="valor_unitario"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type="float"
          value={row.valorUnitario}
          textAlign="end"
          isLabelDisabled
        />
      </div>
    );
  } else if (row.type === 'item') {
    return (
      <span className="text-right block w-full pr-2">
        {formatNumber(row.valorUnitario)}
      </span>
    );
  }
  return '';
};