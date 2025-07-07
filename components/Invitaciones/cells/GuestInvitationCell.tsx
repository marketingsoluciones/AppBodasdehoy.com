import { FC, useEffect, useState } from 'react';
import { InvitacionesIcon } from '../../../components/icons';
import useHover from '../../../hooks/useHover';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { GuestCellProps } from '../types';

interface GuestInvitationCellProps extends GuestCellProps {
  setArrEnviatInvitaciones: (ids: string[]) => void;
}

export const GuestInvitationCell: FC<GuestInvitationCellProps> = ({
  value,
  row,
  setArrEnviatInvitaciones
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [invitationStatus, setInvitationStatus] = useState(value);
  const [hoverRef, isHovered] = useHover();

  useEffect(() => {
    setInvitationStatus(value);
  }, [value]);

  const handleClick = () => {
    if (row.original.correo !== "") {
      if (!invitationStatus) {
        setArrEnviatInvitaciones([row.original._id]);
      }
    } else {
      toast("error", "No tiene Correo asignado");
    }
  };

  const isSent = Boolean(invitationStatus);
  const statusText = isSent ? t("enviado") : t("no enviado");
  const statusColor = isSent ? "text-green-600" : "text-red-600";
  const cursorClass = isSent ? "" : "cursor-pointer transform transition hover:scale-105";

  return (
    <div
      ref={hoverRef}
      className={`truncate relative w-full h-full flex items-center justify-center pl-3 gap-1 ${statusColor} ${cursorClass}`}
      onClick={handleClick}
    >
      <InvitacionesIcon className="w-5 h-5" />
      <p className="font-display text-md truncate first-letter:capitalize">
        {statusText}
      </p>
    </div>
  );
}; 