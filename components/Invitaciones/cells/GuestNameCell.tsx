import { FC } from 'react';
import { GuestCellProps } from '../types';
import { PROFILE_IMAGES, DEFAULT_PROFILE_IMAGE } from '../constants';

export const GuestNameCell: FC<GuestCellProps> = ({ cell, row, value }) => {
  const { sexo } = row.original;

  const profileImage = PROFILE_IMAGES[sexo]?.image || DEFAULT_PROFILE_IMAGE;
  const profileAlt = PROFILE_IMAGES[sexo]?.alt || 'Usuario';

  return (
    <div className="flex gap-1 items-center justify-center md:justify-start">
      <img
        src={profileImage}
        alt={profileAlt}
        className="rounded-full object-cover md:w-10 md:h-10 w-7 h-7"
      />
      <p className="font-display text-sm capitalize overflow-ellipsis truncate">
        {value}
      </p>
    </div>
  );
}; 