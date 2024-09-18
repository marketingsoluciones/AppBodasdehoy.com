import { FC } from "react";
import { useEffect, useMemo, useState, } from "react";
import { InvitacionesIcon } from "../../components/icons";
import useHover from "../../hooks/useHover";
import { ConfirmationBlock } from "../../components/Invitaciones/ConfirmationBlock"
import { DataTable } from "../../components/Invitaciones/DataTable"
import { getRelativeTime } from "../../utils/FormatTime";
import { useTranslation } from 'react-i18next';

export const GuestTable: FC<any> = ({ data, multiSeled, reenviar, activeFunction }) => {
  const { t } = useTranslation();
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([]);
  const Columna = useMemo(
    () => [
      {
        Header: t("name"),
        accessor: "nombre",
        id: "nombre",
        isVisible: false,
        Cell: (props) => {
          const [value, setValue] = useState(props.cell.value);
          useEffect(() => {
            setValue(props.cell.value);
          }, [props.cell.value]);
          const { sexo } = props?.row?.original;
          const image = {
            hombre: {
              image: "/profile_men.png",
              alt: "Hombre",
            },
            mujer: {
              image: "profile_woman.png",
              alt: "Mujer",
            },
          };
          return (

            <div className="flex gap-1 items-center justify-center md:justify-start ">
              <img
                src={image[sexo]?.image ? image[sexo]?.image : "/placeholder/user.png"}
                className="rounded-full object-cover md:w-10 md:h-10 w-7 h-7"
              />
              <p className="font-display text-sm capitalize overflow-ellipsis text-black truncate">
                {value}
              </p>
            </div>
          );
        },
      },
      {
        Header: t("mail"),
        accessor: "correo",
        id: "correo",
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
        Cell: (props) => {
          const [value, setValue] = useState(props.value);
          const [hoverRef, isHovered] = useHover();
          useEffect(() => {
            setValue(props.value);
          }, [props.value]);

          const handleClick = () => {
            if (!value) {
              setArrEnviatInvitaciones([props?.row?.original?._id]);
            }
          };
          return (
            <>
              <div
                ref={hoverRef}
                className={`truncate relative w-full h-full flex items-center justify-center pl-3 gap-1 text-${value
                  ? "green"
                  : "red cursor-pointer transform transition hover:scale-105"
                  }`}
                onClick={handleClick}
              >
                <InvitacionesIcon className="w-5 h-5 " />
                <p className="font-display text-md text-black truncate first-letter:capitalize">{value ? t("enviado") : t("no enviado")}</p>
              </div>
            </>
          );
        },
      },
      {
        Header: t("companions"),
        accessor: "acompañantes",
        id: "acompañantes",
        Cell: (props) => {
          const [value, setValue] = useState(props.value);
          const [hoverRef, isHovered] = useHover();

          return (
            <>
              <div
                ref={hoverRef}
                className={`truncate relative w-full h-full flex items-center justify-center pl-3 gap-1  cursor-pointer transform transition hover:scale-105"`}
              >
                0
              </div>
            </>
          );
        },
      },
      {
        Header: t("envoy"),
        accessor: "date",
        id: "date",
        Cell: (props) => {
          const [value, setValue] = useState(props.value);
          useEffect(() => {
            setValue(props.value);
          }, [props.value]);
          return (
            <>
              <div
                className={`group truncate relative w-full h-full flex items-center justify-center pl-3 gap-1 `}
              >
                <p className="font-display text-md text-black truncate hidden md:block first-letter:capitalize">
                  {value ? getRelativeTime(value) : t("sin enviar")}
                </p>
              </div>
            </>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="">
      {arrEnviarInvitaciones.length > 0 && (
        <ConfirmationBlock
          arrEnviarInvitaciones={arrEnviarInvitaciones}
          set={(act) => setArrEnviatInvitaciones(act)}
        />
      )}
      <DataTable
        columns={Columna}
        data={data}
        multiSeled={multiSeled}
        setArrEnviatInvitaciones={setArrEnviatInvitaciones}
        reenviar={reenviar}
        activeFunction={activeFunction}
      />
    </div>
  );
};