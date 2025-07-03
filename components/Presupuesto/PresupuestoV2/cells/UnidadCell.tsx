import React from 'react';
import { EditableSelect } from '../../../Forms/EditableSelect';
import { TableRow } from '../types';

interface UnidadCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
}

const optionsSelect = [
  { title: "xUni", value: "xUni." },
  { title: "xInv", value: "xInv." },
  { title: "xAdultos", value: "xAdultos." },
  { title: "xNiños", value: "xNiños." },
];

export const UnidadCell: React.FC<UnidadCellProps> = ({ row, onRowChange }) => {
  if (row.type === 'item' && row.unidad) {
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
      <EditableSelect
        accessor="unidad"
        value={row.unidad}
        optionsSelect={optionsSelect}
        size={70}
        handleChange={(values) => onRowChange(values, mockInfo)}
      />
    );
  }
  return <span className="text-center block w-full">{row.unidad}</span>;
};