import React from 'react';
import { GoEyeClosed } from 'react-icons/go';
import { EditableLabelWithInput } from '../../../Forms/EditableLabelWithInput';
import { TableRow } from '../types';

interface PartidaCellProps {
  row: TableRow;
  onRowChange: (values: any, info: any) => void;
}

export const PartidaCell: React.FC<PartidaCellProps> = ({ row, onRowChange }) => {
  if (row.type === 'expense' && row.partida) {
    const gastoOriginal = row.gastoOriginal;
    const isHidden = gastoOriginal?.estatus === false;
    
    const mockInfo = {
      row: {
        original: {
          object: row.object,
          categoriaID: row.categoriaID,
          gastoID: row.gastoID,
          itemID: row.itemID,
          _id: row.gastoID
        }
      }
    };

    return (
      <div className="flex items-center gap-2">
        {isHidden && (
          <GoEyeClosed className="w-4 h-4 text-gray-400 flex-shrink-0" title="Partida oculta" />
        )}
        <EditableLabelWithInput
          accessor="gasto"
          handleChange={(values) => onRowChange(values, mockInfo)}
          type={null}
          value={row.partida}
          textAlign="left"
          isLabelDisabled
        />
      </div>
    );
  }
  return <span className="text-left block w-full">{row.partida}</span>;
};