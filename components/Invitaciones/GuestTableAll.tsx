import { FC, useState, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { DataTableInvitaciones } from "./DataTableInvitaciones";
import { GuestTableProps, ColumnConfig } from "./types";
import { GuestNameCell } from "./cells/GuestNameCell";
import { GuestEmailCell } from "./cells/GuestEmailCell";
import { GuestInvitationCell } from "./cells/GuestInvitationCell";
import { GuestCompanionsCell } from "./cells/GuestCompanionsCell";
import { GuestDateCell } from "./cells/GuestDateCell";
import { EventContextProvider, AuthContextProvider } from "../../context";
import { comunicacion, guests, Event } from "../../utils/Interfaces";
import { HiOutlineMail } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { RelativeTime } from "../Utils/RelativeTime";
import { Loader2, Send } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import i18next from "i18next";

interface Props {
  multiSeled?: boolean;
}

export const GuestTableAll: FC<Props> = ({ multiSeled = false }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
  const auth = AuthContextProvider();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState<string[]>([]);
  const [resendStatus, setResendStatus] = useState<Record<string, boolean>>({});
  const toast = useToast();

  const getResendKey = useCallback((guestId: string, communication: comunicacion, index?: number) => {
    const keyParts = [
      guestId,
      communication.message_id,
      communication.template_id,
      communication.transport,
      typeof index === "number" ? index.toString() : ""
    ].filter(Boolean);
    return keyParts.join("-");
  }, []);

  const handleResend = async (guest: guests, communication: comunicacion, index: number) => {
    if (!event?._id) {
      toast("error", t("No hay evento seleccionado"));
      return;
    }

    const transport = communication.transport === "whatsapp" ? "whatsapp" : "email";
    const resendKey = getResendKey(guest._id, communication, index);

    setResendStatus((prev) => ({ ...prev, [resendKey]: true }));

    try {
      const result = await fetchApiEventos({
        query: queries.sendComunications,
        variables: {
          evento_id: event._id,
          invitados_ids_array: [guest._id],
          dominio: auth?.config?.dominio,
          transport,
          lang: i18next.language,
          template_id: communication.template_id
        }
      }) as { total: number, results: { invitado_id: string, comunicacion: comunicacion }[] };
      if (result?.total > 0) {
        const f1 = event.invitados_array.findIndex((inv: any) => inv._id === guest._id);
        event.invitados_array[f1].comunicaciones_array.push(result.results[0].comunicacion);
        setEvent({ ...event });
      }

      toast("success", transport === "email" ? t("Envio por email exitoso") : t("Envio por WhatsApp exitoso"));
    } catch (error) {
      console.error("Error reenviando invitación:", error);
      toast("error", t("Error al enviar invitaciones"));
    } finally {
      setResendStatus((prev) => ({ ...prev, [resendKey]: false }));
    }
  };


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
      Header: t("asistencia"),
      accessor: "asistencia",
      id: "asistencia",
      Cell: (props: any) => {
        return <div className="w-full flex flex-col cursor-default text-center">
          {t(props.data[props.row.index].asistencia).toUpperCase()}
        </div>
      }
    },
    {
      Header: t("comunicaciones"),
      accessor: "comunicaciones_array",
      id: "comunicaciones_array",
      Cell: (props: any) => {
        const guest: guests = props.data[props.row.index];

        return <div className="w-full flex flex-col cursor-default">
          {guest.comunicaciones_array?.map((elem: comunicacion, idx: number) => {
            const resendKey = getResendKey(guest._id, elem, idx);
            const isResending = !!resendStatus[resendKey];

            return (
              <div key={idx} className="w-full flex items-center py-0.5 gap-2 hover:bg-blue-100 px-2 rounded-xl">
                {elem.transport === "email"
                  ? <HiOutlineMail className="w-6 h-6 text-primary" />
                  : <FaWhatsapp className="w-6 h-6 text-green" />}
                <div className="w-[40%] flex flex-col leading-3">
                  <span className="text-xs">{elem.template_name}</span>
                  {elem?.statuses?.[0]?.timestamp ? (
                    <RelativeTime
                      date={elem.statuses[0].timestamp}
                      className="text-[10px]"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-500">{t("waiting")}</span>
                  )}
                </div>
                <div className="w-[50%] flex flex-wrap items-center gap-1">
                  {elem.statuses.map((status: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2 rounded-full text-[9px] bg-orange-100 text-orange-800 border-[1px] border-orange-800">{status.name}</span>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleResend(guest, elem, idx)}
                    disabled={isResending}
                    className="w-full h-full rounded-full hover:bg-gray-50 transition-all duration-300 bg-white px-2 py-0.5 flex items-center justify-center gap-1 text-[10px] text-blue-700 hover:text-blue-700 hover:font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isResending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t("reenviar").toUpperCase()}
                  </button>
                </div>
              </div>
            )
          })}
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
  ], [getResendKey, handleResend, resendStatus, t]);

  return (
    <div className="flex w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
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