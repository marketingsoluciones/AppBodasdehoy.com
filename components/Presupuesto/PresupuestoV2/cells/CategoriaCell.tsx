import React from 'react';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface CategoriaCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
}

export const CategoriaCell: React.FC<CategoriaCellProps> = ({ row, onRowChange }) => {
  if (row.type === 'category' && row.categoria) {
    const mockInfo = {
      row: {
        original: {
          object: row.object,
          categoriaID: row.categoriaID,
          gastoID: row.gastoID,
          itemID: row.itemID,
          _id: row.categoriaID
        }
      }
    };

    return (
      <div className="flex items-center gap-2">
        <EditableLabelWithInput
          accessor="categoria"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type={null}
          value={row.categoria}
          textAlign="left"
          isLabelDisabled
        />
      </div>
    );
  }
  return <span className="text-left block w-full">{row.categoria}</span>;
};