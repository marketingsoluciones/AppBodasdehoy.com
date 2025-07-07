import { FC } from 'react';
import { useRouter } from 'next/router';
import { GuestCellProps } from '../types';

export const GuestEmailCell: FC<GuestCellProps> = ({ value, row }) => {
  const router = useRouter();

  if (value !== "") {
    return <div>{value}</div>;
  }

  return (
    <button
      onClick={() => router.push("invitados")}
      className="text-primary hover:text-primary-dark transition-colors"
    >
      Agregar Email
    </button>
  );
}; 