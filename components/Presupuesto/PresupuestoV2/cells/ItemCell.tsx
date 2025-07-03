import React from 'react';
import { GoEyeClosed } from 'react-icons/go';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface ItemCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
  categorias_array: any[];
}

export const ItemCell: React.FC<ItemCellProps> = ({ row, onRowChange, categorias_array }) => {
  if (row.type === 'item' && row.item) {
    // Buscar el item original para verificar su estatus
    const categoria = categorias_array.find(cat => cat._id === row.categoriaID);
    const gasto = categoria?.gastos_array?.find(g => g._id === row.gastoID);
    const itemOriginal = gasto?.items_array?.find(item => item._id === row.itemID);
    const isHidden = itemOriginal?.estatus === true; // true significa oculto para items
    
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
      <div className="flex items-center gap-2">
        {isHidden && (
          <GoEyeClosed className="w-4 h-4 text-gray-400 flex-shrink-0" title="Item oculto" />
        )}
        <EditableLabelWithInput
          accessor="nombre"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type={null}
          value={row.item}
          textAlign="left"
          isLabelDisabled
        />
      </div>
    );
  }
  return <span className="text-left block w-full">{row.item}</span>;
};