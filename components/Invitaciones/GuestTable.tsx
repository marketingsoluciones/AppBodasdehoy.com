import { FC } from "react";
import { useEffect, useMemo, useState, } from "react";
import { InvitacionesIcon } from "../../components/icons";
import useHover from "../../hooks/useHover";
import { EventContextProvider } from "../../context";
import { ConfirmationBlock } from "../../components/Invitaciones/ConfirmationBlock"
import { DataTable } from "../../components/Invitaciones/DataTable"
import { getFormatTime, getRelativeTime } from "../../utils/FormatTime";

export const GuestTable: FC<any> = ({ data, multiSeled, reenviar, activeFunction }) => {
  const [arrEnviarInvitaciones, setArrEnviatInvitaciones] = useState([]);
  const Columna = useMemo(
    () => [
      {
        Header: "NOMBRE",
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
                src={image[sexo]?.image}
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
        Header: "CORREO",
        accessor: "correo",
        id: "correo",
      },
      {
        Header: "TELEFONO",
        accessor: "telefono",
        id: "telefono",
      },
      {
        Header: "INVITACION",
        accessor: "invitacion",
        id: "invitacion",
        Cell: (props) => {
          const [value, setValue] = useState(props.value);
          const [hoverRef, isHovered] = useHover();
          useEffect(() => {
            setValue(props.value);
          }, [props.value]);

          const mensaje = {
            true: "Enviado",
            false: "No enviado",
          };

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
                <p className="font-display text-md text-black truncate  ">{mensaje[value]}</p>
              </div>
            </>
          );
        },
      },
      {
        Header: "ACOMPAÑANTES",
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
        Header: "ENVIADO",
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
                <p className="font-display text-md text-black truncate hidden md:block ">{value ? getRelativeTime(value) : "Sin enviar"}</p>
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
      <DataTable columns={Columna} data={data} multiSeled={multiSeled} setArrEnviatInvitaciones={setArrEnviatInvitaciones} reenviar={reenviar} activeFunction={activeFunction}/>
    </div>
  );
};