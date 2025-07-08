import { FC } from 'react';
import useHover from '../../../hooks/useHover';
import { GuestCellProps } from '../types';

export const GuestCompanionsCell: FC<GuestCellProps> = ({ value }) => {
  const [hoverRef, isHovered] = useHover();

  return (
    <div
      ref={hoverRef}
      className="truncate relative w-full h-full flex items-center justify-center pl-3 gap-1 cursor-pointer transform transition hover:scale-105"
    >
      {value || 0}
    </div>
  );
}; 