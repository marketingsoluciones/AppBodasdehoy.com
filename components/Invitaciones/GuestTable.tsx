import { FC, useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { ConfirmationBlock } from "./ConfirmationBlock";
import { DataTableInvitaciones } from "./DataTableInvitaciones";
import { GuestTableProps, ColumnConfig } from "./types";
import { GuestNameCell } from "./cells/GuestNameCell";
import { GuestEmailCell } from "./cells/GuestEmailCell";
import { GuestInvitationCell } from "./cells/GuestInvitationCell";
import { GuestCompanionsCell } from "./cells/GuestCompanionsCell";
import { GuestDateCell } from "./cells/GuestDateCell";

export const GuestTable: FC<GuestTableProps> = ({
  data,
  multiSeled = false,
  activeFunction,
  optionSelect
}) => {
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState<string[]>([]);

  const columns = useMemo((): ColumnConfig[] => [
    {
      Header: t("name"),
      accessor: "nombre",
      id: "nombre",
      isVisible: false,
      Cell: (props: any) => <GuestNameCell {...props} />
    },
    {
      Header: t("mail"),
      accessor: "correo",
      id: "correo",
      Cell: (props: any) => <GuestEmailCell {...props} />
    },
    {
      Header: t("phone"),
      accessor: "telefono",
      id: "telefono",
    },
    {
      Header: t("invitation"),
      accessor: "invitacion",
      id: "invitacion",
      Cell: (props: any) => (
        <GuestInvitationCell
          {...props}
          setArrEnviatInvitaciones={setArrEnviatInvitaciones}
        />
      )
    },
    {
      Header: t("companions"),
      accessor: "acompañantes",
      id: "acompañantes",
      Cell: (props: any) => <GuestCompanionsCell {...props} />
    },
    {
      Header: t("envoy"),
      accessor: "date",
      id: "date",
      Cell: (props: any) => <GuestDateCell {...props} />
    },
  ], [t, setArrEnviatInvitaciones]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <DataTableInvitaciones
        columns={columns}
        data={data}
        multiSeled={multiSeled}
        activeFunction={activeFunction}
        optionSelect={optionSelect}
        arrEnviarInvitaciones={arrEnviarInvitaciones}
      />
    </div>
  );
};