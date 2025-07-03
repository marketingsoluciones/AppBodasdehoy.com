import React from 'react';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface CantidadCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
}

export const CantidadCell: React.FC<CantidadCellProps> = ({ row, onRowChange }) => {
  if (row.type === 'item' && row.unidad === 'xUni.') {
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
      <div className="flex justify-center">
        <EditableLabelWithInput
          accessor="cantidad"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type="int"
          value={row.cantidad}
          textAlign="center"
          isLabelDisabled
        />
      </div>
    );
  }
  return <span className="text-center block w-full">{row.cantidad}</span>;
};