import { FC, useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { DataTableInvitaciones } from "./DataTableInvitaciones";
import { GuestTableProps, ColumnConfig } from "./types";
import { GuestNameCell } from "./cells/GuestNameCell";
import { GuestEmailCell } from "./cells/GuestEmailCell";
import { GuestInvitationCell } from "./cells/GuestInvitationCell";
import { GuestCompanionsCell } from "./cells/GuestCompanionsCell";
import { GuestDateCell } from "./cells/GuestDateCell";
import { EventContextProvider } from "../../context";
import { comunicacion, guests } from "../../utils/Interfaces";
import { HiOutlineMail } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { RelativeTime } from "../Utils/RelativeTime";

interface Props {
  multiSeled?: boolean;
}

export const GuestTableAll: FC<Props> = ({ multiSeled = false }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState<string[]>([]);


  const columns = useMemo((): ColumnConfig[] => [
    {
      Header: t("name"),
      accessor: "nombre",
      id: "nombre",
      Cell: (props: any) => {
        const customValue = <div className="flex flex-col leading-3">
          <span className="font-bold pb-1">{props.data[props.row.index].nombre}</span>
          <span className="text-[10px] truncate">{props.data[props.row.index].correo}</span>
          <span className="text-[10px]">{props.data[props.row.index].telefono}</span>
        </div>
        return <GuestNameCell {...props} value={customValue} />
      }
    },
    {
      Header: t("comunicaciones"),
      accessor: "comunicaciones_array",
      id: "comunicaciones_array",
      Cell: (props: any) => {
        return <div className="w-full flex flex-col cursor-default">
          {props.data[props.row.index].comunicaciones_array.map((elem: comunicacion, idx: number) => (
            <div key={idx} className="w-full flex items-center py-0.5 gap-2 hover:bg-blue-100">
              {elem.transport === "email"
                ? <HiOutlineMail className="w-6 h-6 text-primary" />
                : <FaWhatsapp className="w-6 h-6 text-green" />}
              <div className="w-[40%] flex flex-col leading-3">
                <span className="text-sm">{elem.template_name}</span>
                <RelativeTime
                  date={elem.statuses[0].timestamp}
                  className="text-[10px]"
                />
              </div>
              <div className="w-[50%] flex flex-wrap items-center gap-1">
                {elem.statuses.map((status: any, idx: number) => (
                  <span key={idx} className="inline-flex items-center px-2 rounded-full text-[9px] bg-orange-100 text-orange-800 border-[1px] border-orange-800">{status.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
    },
    // {
    //   Header: t("mail"),
    //   accessor: "correo",
    //   id: "correo",
    //   Cell: (props: any) => <GuestEmailCell {...props} />
    // },
    // {
    //   Header: t("phone"),
    //   accessor: "telefono",
    //   id: "telefono",
    // },
    // {
    //   Header: t("invitation"),
    //   accessor: "invitacion",
    //   id: "invitacion",
    //   Cell: (props: any) => (
    //     <GuestInvitationCell
    //       {...props}
    //       setArrEnviatInvitaciones={setArrEnviatInvitaciones}
    //     />
    //   )
    // },
    // {
    //   Header: t("companions"),
    //   accessor: "acompañantes",
    //   id: "acompañantes",
    //   Cell: (props: any) => <GuestCompanionsCell {...props} />
    // },
    // {
    //   Header: t("envoy"),
    //   accessor: "date",
    //   id: "date",
    //   Cell: (props: any) => <GuestDateCell {...props} />
    // },
  ], [t, setArrEnviatInvitaciones]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <DataTableInvitaciones
        columns={columns}
        data={event?.invitados_array || []}
        multiSeled={multiSeled}
        arrEnviarInvitaciones={arrEnviarInvitaciones}
        eventId={event?._id}
      />
    </div>
  );
};