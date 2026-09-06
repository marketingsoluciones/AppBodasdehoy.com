import { useEffect, useRef, useState, useMemo, FC, Dispatch, SetStateAction, cloneElement, useCallback, ReactNode } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useRouter } from "next/navigation";
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import DataTableFinal from "./DataTable";
import { BorrarInvitado } from "../../hooks/EditarInvitado";
import { CanceladoIcon, ConfirmadosIcon, DotsOpcionesIcon, PendienteIcon, } from "../icons";
import { Event, guests, table } from "../../utils/Interfaces";
import { DataTableGroupContextProvider, DataTableGroupProvider, } from "../../context/DataTableGroupContext";
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { LiaLinkSolid } from "react-icons/lia";
import { CopiarLink } from "../Utils/Compartir";
import { SubTabla } from "./SubTabla";
import { IoIosArrowDown } from "react-icons/io";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "../Utils/DeleteConfirmation";
import { useTranslation } from 'react-i18next';
import CopilotFilterBar from "../Utils/CopilotFilterBar";

interface propsDatatableGroup {
  GruposArray: string[];
  setSelected: Dispatch<SetStateAction<string>>;
  isMounted: boolean;
  setIsMounted: Dispatch<SetStateAction<boolean>>;
  menu?: any[]
  setGetMenu?: any
  handleClick?: any
}

interface guestsExt extends guests {
  tableNameRecepcion: Partial<table>
  tableNameCeremonia: Partial<table>
}

interface handleMoveGuest {
  event: Event
  setEvent: any
  toast: any
  invitadoID: string
  previousTable: Partial<table>
  lastTable: Partial<table>
  f1: number
  t: any
}



/**
 * Antes este handler mutaba event.planSpace[f1].tables[f2].guests con splice/push
 * y luego hacía setEvent({ ...event }). El spread top-level NO clona los hijos →
 * React no detecta el cambio en planSpace[].tables[].guests; cualquier memo o
 * useEffect que dependa de identidad de referencia se queda con datos viejos.
 *
 * Refactor: actualizar inmutablemente usando el updater funcional de setEvent
 * (ya envuelto en EventContext con persistencia a localStorage).
 */
export const handleMoveGuest = (props: handleMoveGuest) => {
  try {
    const { invitadoID, previousTable, lastTable, f1, event, setEvent, toast } = props
    if (previousTable?._id) {
      const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === previousTable?._id)
      const newGuests = event.planSpace[f1].tables[f2].guests.filter(g => g._id !== invitadoID)

      setEvent((prev) => ({
        ...prev,
        planSpace: prev.planSpace.map((ps, i) =>
          i !== f1 ? ps : {
            ...ps,
            tables: ps.tables.map((tb, j) =>
              j !== f2 ? tb : { ...tb, guests: newGuests }
            ),
          }
        ),
      }))

      fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: event?.planSpace[f1]?._id,
          tableID: event.planSpace[f1].tables[f2]?._id,
          variable: "guests",
          valor: JSON.stringify(newGuests),
        },
      });
      if (!lastTable) {
        toast("success", props.t(`El invitado no está sentado en ninguna mesa`),)
      }
    }
    if (lastTable) {
      for (let i = 0; i < lastTable?.numberChair; i++) {
        if (!lastTable?.guests?.map(el => el.chair).includes(i)) {
          if (lastTable) {
            const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === lastTable?._id)
            const newGuests = [
              ...event.planSpace[f1].tables[f2].guests,
              { _id: invitadoID, chair: i, order: new Date() },
            ]

            setEvent((prev) => ({
              ...prev,
              planSpace: prev.planSpace.map((ps, k) =>
                k !== f1 ? ps : {
                  ...ps,
                  tables: ps.tables.map((tb, j) =>
                    j !== f2 ? tb : { ...tb, guests: newGuests }
                  ),
                }
              ),
            }))

            fetchApiEventos({
              query: queries.editTable,
              variables: {
                eventID: event._id,
                planSpaceID: event?.planSpace[f1]?._id,
                tableID: event.planSpace[f1].tables[f2]?._id,
                variable: "guests",
                valor: JSON.stringify(newGuests),
              },
            });
            toast("success", `${props.t("El invitado fue sentado en la mesa")}; ${lastTable.title}, ${props.t("puesto")}: ${i + 1}`,)
          }
          break
        }
      }
    }
  } catch (error) {
    console.error('[handleMoveGuest] error:', error)
  }
}

const DatatableGroup: FC<propsDatatableGroup> = ({ setSelected, isMounted, setIsMounted, menu = [], handleClick }) => {
  const { t } = useTranslation()
  const toast = useToast()
  const { event, setEvent, invitadoCero, setInvitadoCero, allFilterGuests, planSpaceActive, setPlanSpaceActive, filterGuests } = EventContextProvider();
  const { copilotFilter } = EventsGroupContextProvider();
  const GuestsFathers = event?.invitados_array?.filter((invitado) => invitado && !invitado?.father)
  const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);
  const [isAllowed] = useAllowed()
  const [acompañanteID, setAcompañanteID] = useState({ id: "", crear: true })
  const [modal, setModal] = useState<{
    state: boolean
    title: string | null
    subTitle?: ReactNode
    handle: (() => void) | null
  }>({ state: false, title: null, subTitle: null, handle: () => { } })


  useEffect(() => {
    setAcompañanteID(old => ({ ...old, crear: false }))
  }, [acompañanteID.id])

  useEffect(() => {
    setInvitadoCero(
      event?.invitados_array?.find(
        (elem) => elem?.rol?.toLowerCase() === event?.grupos_array?.[0]?.toLowerCase()
      )?.nombre
    )
  }, [event?.invitados_array, event?.grupos_array, event])

  useEffect(() => {
    let asd = {}
    for (let i = 0; i < event?.grupos_array?.length; i++) {
      asd = { ...asd, [event?.grupos_array[i]]: { titulo: event?.grupos_array[i], data: [] } }
    }
    const tablesRecepcion = event?.planSpace?.find(elem => elem?.title === "recepción")?.tables
    const tablesCeremonia = event?.planSpace?.find(elem => elem?.title === "ceremonia")?.tables
    const Data = (GuestsFathers ?? []).reduce((acc, item: guestsExt) => {
      const guestRecepcion = allFilterGuests[0]?.sentados.find(elem => elem._id === item._id)
      const guestCeremonia = allFilterGuests[1]?.sentados.find(elem => elem._id === item._id)
      const tableRecepcion = tablesRecepcion?.find(elem => elem._id === guestRecepcion?.tableID)
      const tableCeremonia = tablesCeremonia?.find(elem => elem._id === guestCeremonia?.tableID)
      item.chairs = [
        { planSpaceName: "recepción", chair: guestRecepcion?.chair, table: tableRecepcion },
        { planSpaceName: "ceremmonia", chair: guestCeremonia?.chair, table: tableCeremonia },
      ]
      item.tableNameRecepcion = tableRecepcion?.title ? tableRecepcion : { title: "no asignado" }
      item.tableNameCeremonia = tableCeremonia?.title ? tableCeremonia : { title: "no asignado" }

      // Match case-insensitive: SelectField antiguo guardaba rol en minúsculas
      // mientras grupos_array mantiene "Familia novia". Usar la clave canónica del grupo.
      const grupoKey = event?.grupos_array?.find(
        (g) => g?.toLowerCase() === item?.rol?.toLowerCase()
      )
      if (grupoKey) {
        acc[grupoKey] = { titulo: grupoKey, data: acc[grupoKey]?.data ? [...acc[grupoKey]?.data, item] : [item] }
      } else {
        acc["no asignado"] = { titulo: "no asignado", data: acc["no asignado"]?.data ? [...acc["no asignado"]?.data, item] : [item] }
      }
      return acc;
    }, asd);
    Data && setData(Object.values(Data));
  }, [allFilterGuests, event?.invitados_array, event?.grupos_array, event?.planSpace]);

  const renderRowSubComponent = useCallback(({ row }) => (
    <SubTabla
      row={row}
      getId={acompañanteID?.id}
      handleClick={handleClick}
      setSelected={setSelected}
      isMounted={isMounted}
      setIsMounted={setIsMounted} 
      />
  ),
    [acompañanteID]
  )

  // Funcion para Editar Invitado dropdown
  const updateMyData = ({
    rowID,
    columnID,
    reemplazar,
    value,
    loading,
    eventoID,
  }) => {
    try {
      // Para modificar el estado
      if (loading == true) {
        setEvent((viejo) => {
          const { invitados_array: arr } = viejo;
          const rowIndex = arr.findIndex((e) => e._id == rowID);
          const resultado = arr.map((invitado) => {
            if (invitado._id === rowID) {
              //Para escribir en base de datos
              fetchApiBodas({
                query: queries.editGuests,
                variables: {
                  eventID: event._id,
                  guestID: invitado._id,
                  datos: { [reemplazar]: value }
                },
              });
              return {
                ...arr[rowIndex],
                [columnID]: value,
              };
            }
            return invitado;
          });
          return {
            ...viejo,
            invitados_array: resultado,
          };
        });
      }
    } catch (error) {
    }
  };


  //Definir Columnas
  const CrearColumna = (title) => {
    return [
      {
        Header: () => {
          return (
            <h3 className=" text-gray-500 text-left truncate capitalize font-medium">
              {t(title)}
            </h3>
          );
        },
        accessor: "nombre", // accessor es la "key" en la data(invitados)
        id: "nombre",
        Cell: (props) => {
          const value = props?.cell?.value;
          const { sexo, _id: id } = props?.row?.original;
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
          const handleClick = () => {
            setSelected(id);
            setIsMounted(!isMounted);
          };

          return (
            <div
              className="flex justify-start items-center truncate pr-3 cursor-pointer"
              onClick={!isAllowed() ? null : handleClick}
            >
              <img
                className="block w-10 h-10 mr-2"
                src={image[sexo]?.image}
                alt={image[sexo]?.alt}
              />
              <p className="font-display text-sm capitalize overflow-ellipsis text-gray-700">
                {value}
              </p>
            </div>
          );
        },
      },
      {
        Header: t("Asistencia"),
        accessor: "asistencia",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue ?? "pendiente");
          const [show, setShow] = useState(false);
          const [loading, setLoading] = useState(false);
          useEffect(() => {
            setLoading(false);
            updateMyData({
              rowID: row.original._id,
              columnID: id,
              reemplazar: "asistencia",
              value: value,
              loading: loading,
              eventoID: event._id,
            });
            setLoading(true);
          }, [value]);

          const Lista = [
            {
              title: "pendiente",
              icon: <PendienteIcon />,
            },
            {
              title: "confirmado",
              icon: <ConfirmadosIcon />,
            },
            {
              title: "cancelado",
              icon: <CanceladoIcon />,
            },
          ];
          const dicc = Lista.reduce((acc, el) => {
            acc[el.title] = { ...el };
            return acc;
          }, {});

          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full items-center justify-center flex">
                <button
                  className="font-display text-gray-500 hover:text-gray-400 transition text-sm capitalize flex gap-2 items-center justify-center focus:outline-none"
                  onClick={() => !isAllowed() ? null : setShow(!show)}
                >
                  {dicc[value]?.icon && cloneElement(dicc[value]?.icon, { className: "w-5 h-5" })}
                  {t(value)}
                </button>
                <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 -left-9 z-40`}
                >
                  {Lista.map((item, index) => {
                    return (
                      <li
                        key={index}
                        className={`${value?.toLowerCase() === item?.title?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                        onClick={() => {
                          setValue(item.title);
                          setShow(!show);
                        }}
                      >
                        {cloneElement(item.icon, { className: "w-5 h-5" })}
                        {t(item.title)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: t("Menu"),
        accessor: "nombre_menu",
        Cell: ({ value: initialValue, row, column: { id } }) => {

          const [value, setValue] = useState(row?.original?.nombre_menu ? row?.original?.nombre_menu : "sin menú");
          const [show, setShow] = useState(false);
          const [loading, setLoading] = useState(false);
          useEffect(() => {
            setLoading(false);
            updateMyData({
              rowID: row.original._id,
              columnID: id,
              reemplazar: "nombre_menu",
              value: value,
              loading: loading,
              eventoID: event._id,
            });
            setLoading(true);
          }, [value]);

          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full items-center justify-center flex">
                <button
                  className="font-display text-gray-500 hover:text-gray-400 transition text-sm capitalize flex gap-2 items-center justify-center focus:outline-none"
                  onClick={() => !isAllowed() ? null : setShow(!show)}
                >
                  {t(value)}
                </button>
                <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 -left-[13px] z-40 w-max`}
                >
                  {event.menus_array?.length > 0 && event?.menus_array?.map((item, index) => {
                    return (
                      <li
                        key={index}
                        className={`${value?.toLowerCase() === item?.nombre_menu?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                        onClick={(e) => {
                          setValue(item.nombre_menu);
                          setShow(!show);
                        }}
                      >
                        {t(item?.nombre_menu)}
                      </li>
                    );
                  })}
                  <li
                    className="cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                    onClick={(e) => {
                      setValue(null);
                      setShow(!show);
                    }}
                  >
                    {t("sin menú")}
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: t("Asientos recepción"),
        accessor: "tableNameRecepcion",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          //console.log(1111234,initialValue)
          const [value, setValue] = useState(initialValue);
          const [show, setShow] = useState(false);
          const router = useRouter();
          const { t } = useTranslation();
          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full flex justify-center items-center">
                {/*value?.toLowerCase() == "no asignado"*/ false ? (
                  <button
                    onClick={() => router.push("/mesas")}
                    className="bg-tertiary font-display text-sm font-medium hover:text-gray-500 px-3 rounded-lg focus:outline-none"
                  >
                    Añadir mesa
                  </button>
                ) : (
                  <button
                    className="focus:outline-none font-display text-sm capitalize"
                    onClick={() => !isAllowed() ? null : setShow(!show)}
                  >
                    {value?.title}
                  </button>
                )}
                <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 z-40 w-max`}
                >
                  {[
                    { _id: null, title: "No Asignado" },
                    ...(event?.planSpace?.find(elem => elem?.title === "recepción")?.tables ?? [])
                  ]?.map((elem: any, index) => {
                    if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) {
                      return (
                        <li
                          key={index}
                          className={`${(value._id === elem._id || (!value._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                          onClick={() => {
                            const f1 = event?.planSpace?.findIndex(elem => elem?.title === "recepción") ?? -1
                            const table = f1 > -1 ? event.planSpace[f1]?.tables?.find(el => el._id === elem._id) : undefined
                            setShow(!show);
                            if (value?._id || elem?._id) {
                              if (value?._id !== elem?._id) {
                                setValue(elem.title);
                                handleMoveGuest({ t, invitadoID: row.original._id, previousTable: value, lastTable: table, f1, event, setEvent, toast })
                              }
                            }
                          }}
                        >
                          {elem?.title}
                        </li>
                      )
                    }
                  })}
                  <li
                    className="bg-gray-300 cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                    onClick={() => router.push("/mesas")}
                  >
                    {t("addtable")}
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: t("Asientos Ceremonia"),
        accessor: "tableNameCeremonia",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue);
          const [show, setShow] = useState(false);
          const router = useRouter();
          const { t } = useTranslation();
          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full flex justify-center items-center">
                {/*value?.toLowerCase() == "no asignado"*/ false ? (
                  <button
                    onClick={() => router.push("/mesas")}
                    className="bg-tertiary font-display text-sm font-medium px-2rounded hover:text-gray-500 px-3 rounded-lg focus:outline-none"
                  >
                    {t("addtable")}
                  </button>
                ) : (
                  <button
                    className="focus:outline-none font-display text-sm capitalize"
                    onClick={() => !isAllowed() ? null : setShow(!show)}
                  >
                    {value.title}
                  </button>
                )}

                <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-7 z-40 w-max`}
                >
                  {[
                    { _id: null, title: "No Asignado" },
                    ...(event?.planSpace?.find(elem => elem?.title === "ceremonia")?.tables ?? [])
                  ]?.map((elem: any, index) => {
                    if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) {
                      return (
                        <li
                          key={index}
                          className={`${(value._id === elem._id || (!value._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                          onClick={() => {
                            const f1 = event?.planSpace?.findIndex(elem => elem?.title === "ceremonia") ?? -1
                            const table = f1 > -1 ? event.planSpace[f1]?.tables?.find(el => el._id === elem._id) : undefined
                            setShow(!show);
                            if (value?._id || elem?._id) {
                              if (value?._id !== elem?._id) {
                                setValue(elem.title);
                                handleMoveGuest({ t, invitadoID: row.original._id, previousTable: value, lastTable: table, f1, event, setEvent, toast })
                              }
                            }
                          }}
                        >
                          {elem?.title}
                        </li>
                      )
                    }
                  })}
                  <li
                    className=" cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                    onClick={() => router.push("/mesas")}
                  >
                    {t("addtable")}
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: t("Acompañantes"),
        accessor: "passesQuantity",
        Cell: ({ value: initialValue, column: { id }, ...props }) => {
          if (event.showChildrenGuest === props.row.original._id && !props?.row?.isExpanded) {
            setAcompañanteID({ id: props.row.original._id, crear: false })
            props?.toggleAllRowsExpanded(false)
            props?.row?.toggleRowExpanded()
            return
          }
          const value = initialValue;
          const handleClick = () => {
            fetchApiBodas({
              query: queries.eventUpdate,
              variables: {
                idEvento: event._id,
                input: { showChildrenGuest: !props?.row?.isExpanded ? props.row.original._id : "" }
              }
            })
            const newShowChildrenGuest = !props?.row?.isExpanded ? props.row.original._id : null
            setEvent((prev) => ({ ...prev, showChildrenGuest: newShowChildrenGuest }))
          }
          return (
            <div className="relative w-full flex justify-center items-center">
              <button
                className="focus:outline-none font-display text-sm capitalize flex items-center"
                onClick={() => !isAllowed() ? null : value && handleClick()}
              >
                {value ? value : 0}
                <div className="w-2">
                  <IoIosArrowDown className={`${!value && "hidden"} ml-1 text-gray-500 ${props?.row?.isExpanded && "rotate-180"}`} />
                </div>
              </button>
            </div >
          );
        },
      },
      {
        Header: "",
        accessor: "compartir",
        Cell: ({ value: initialValue, row }) => {
          const [show, setShow] = useState(false);
          const [showQR, setShowQR] = useState(false);
          const pToken = `${row.original._id}${event._id?.slice(3, 9)}${event._id}`;
          const link = `${window?.location?.origin}?pGuestEvent=${pToken}`;
          const portalLink = `${window?.location?.origin}/e/${event._id}?g=${pToken}`;
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(portalLink)}`;
          return (
            <ClickAwayListener onClickAway={() => { setShow(false); setShowQR(false); }}>
              <div className="relative w-full flex justify-center items-center">
                <button
                  className="focus:outline-none font-display text-sm capitalize"
                  onClick={() => !isAllowed() ? null : setShow(!show)}
                >
                  <LiaLinkSolid className="h-auto w-5" />
                </button>
                {show && <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-6 z-40 w-[300px]`}
                >
                  <li
                    className="flex items-center py-4 px-6 font-display text-sm text-gray-500 bg-base transition w-full capitalize"
                  >
                    <CopiarLink link={link} />
                  </li>
                  <li className="border-t border-gray-100">
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center gap-2 py-3 px-6 font-display text-sm text-pink-600 hover:bg-pink-50 transition w-full text-left"
                    >
                      <span>📱</span>
                      <span>QR portal del evento</span>
                    </button>
                    {showQR && (
                      <div className="px-6 pb-4 flex flex-col items-center gap-2">
                        <img src={qrSrc} alt="QR portal" className="w-40 h-40" />
                        <p className="text-xs text-gray-400 text-center break-all">{portalLink}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(portalLink)}
                          className="text-xs text-pink-500 hover:underline"
                        >
                          Copiar enlace portal
                        </button>
                      </div>
                    )}
                  </li>
                </ul>}
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: () => {
          const [show, setShow] = useState(false);
          const Lista = ["borrar grupo"];
          const { event, setEvent } = EventContextProvider();

          const DeleteGroup = async () => {
            try {
              await fetchApiBodas({
                query: `mutation($evento_id:ID!,$grupo_id:ID!){
                  borraGrupo(evento_id:$evento_id, grupo_id:$grupo_id){
                    success errors{ field message code }
                  }
                }`,
                variables: { evento_id: event._id, grupo_id: title },
              });
            } catch (error) {
            } finally {
              setEvent((old) => ({
                ...old,
                grupos_array: old.grupos_array.filter((e) => e !== title),
              }));
              setModal({ state: false, title: null, handle: null });
            }
          };

          return (
            <ClickAwayListener onClickAway={() => show && setShow(false)}>
              <div className="w-full flex justify-end items-center relative">
                <span
                  onClick={() => !isAllowed() ? null : setShow(!show)}
                  className={`cursor-pointer relative w-max rounded-lg text-sm text-gray-700 ${title === "no asignado" ? "hidden" : ""}`}
                >
                  <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
                </span>
                <ul
                  className={`${show ? "block" : "hidden"
                    } top-0 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10 translate-x-[-12px]`}
                >
                  {Lista.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setShow(false);
                        setModal({
                          state: true,
                          title: title,
                          subTitle: (
                            <span className="flex flex-col">
                              <strong>
                                {t(
                                  "warningdeletegroup",
                                  "Si borras el grupo no lo podrás recuperar."
                                )}
                              </strong>
                            </span>
                          ),
                          handle: () => DeleteGroup(),
                        });
                      }}
                      className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base"
                    >
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
        id: "delete",
        accessor: "delete",
        Cell: (row) => {
          const [show, setShow] = useState(false);

          // Remover Fila invitado
          const HandleRemove = async (rowID) => {
            // Modificar base de datos
            try {
              await BorrarInvitado(event._id, rowID);
            } catch (error) {
            } finally {
              //Modifico el estado y memo
              setEvent((old) => {
                const { invitados_array: arr } = old;

                const resultado = arr.filter(
                  (invitado) => invitado?._id !== rowID
                );
                return {
                  ...old,
                  invitados_array: resultado,
                };
              });
              setShow(!show);
              setModal({ state: false, title: null, handle: null })
            }
          };

          const HandleEdit = (id) => {
            setSelected(id);
            setIsMounted(!isMounted);
          };

          const Lista = [
            {
              title: "Borrar",
              function: () => HandleRemove(row.row.original._id),
            },
            {
              title: "Editar",
              function: () => HandleEdit(row.row.original._id),
            },
          ];

          return (
            <ClickAwayListener onClickAway={() => show && setShow(false)}>
              <div className="w-full flex justify-end items-center relative">
                <span
                  onClick={() => !isAllowed() ? null : setShow(!show)}
                  className="cursor-pointer relative w-max rounded-lg text-sm text-gray-700"
                >
                  <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
                </span>
                <ul
                  className={`${show ? "block" : "hidden"
                    } top-0 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10 translate-x-[-12px]`}
                >
                  {Lista.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        item.title.toLowerCase() === "borrar"
                          ? setModal({
                            state: true,
                            title: `${row.row.cells[0].value}`,
                            subTitle: <span>
                              {!row.row.cells[5].value
                                ? "Será borrado de la lista de invitados."
                                : row.row.cells[5].value === 1
                                  ? "Él y su acompañante serán borrados de la lista de invitados."
                                  : `Él y sus ${row.row.cells[5].value} acompañantes serán borrados de la lista de invitados.`
                              }
                            </span>,
                            handle: () => item.function()
                          })
                          : item.function()
                      }
                      }
                      className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base py-3"
                    >
                      {t(item.title)}
                    </li>
                  ))}
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
    ];
  };

  const displayedData = useMemo(() => {
    if (!copilotFilter || copilotFilter.entity !== 'guests' || !copilotFilter.ids?.length) {
      return data;
    }
    const idSet = new Set(copilotFilter.ids);
    return data
      .map(group => ({ ...group, data: group.data.filter((g: any) => idSet.has(g._id)) }))
      .filter(group => group.data.length > 0);
  }, [data, copilotFilter]);

  return (
    <DataTableGroupProvider>
      <div className="w-[200%] md:w-[100%]">
        {modal.state && (
          <Modal
            set={setModal}
            state={modal}
            classe={"w-[380px] max-w-[95%] h-auto min-h-[220px] !top-1/2 !left-1/2 !right-auto !bottom-auto -translate-x-1/2 -translate-y-1/2"}
          >
            <DeleteConfirmation setModal={setModal} modal={modal} />
          </Modal>
        )}
        <CopilotFilterBar entity="guests" />
        {/* <CheckBoxAll /> */}
        {displayedData?.map((item, idx: number) => {
          return (
            <DataTableFinal
              key={idx}
              data={item.data}
              renderRowSubComponent={renderRowSubComponent}
              columns={CrearColumna(!item.titulo.match("(nombre)") ? item.titulo : item.titulo.replace("(nombre)", invitadoCero ? invitadoCero : event?.grupos_array?.[0]))}
            />
          )
        })}
      </div>
    </DataTableGroupProvider>
  );
};

export default DatatableGroup;


const CheckBoxAll: FC<any> = ({ check, ...rest }) => {
  const {
    dataTableGroup: { arrIDs, checkedAll },
    dispatch,
  } = DataTableGroupContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const refCheckbox: any = useRef(null);
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();

  const getToggleAllRowsSelectedProps = () => {
    const totalGuests: number = event?.invitados_array?.length;
    const guestsSelected: number = arrIDs?.length;
    return {
      checked: totalGuests > 0 && totalGuests === guestsSelected,
      indeterminate: guestsSelected > 0 && totalGuests !== guestsSelected,
    };
  };

  const handleChange = () => {
    dispatch({ type: "CHANGE_STATE_CHECKALL", payload: !checkedAll });
  };

  const eliminarTodo = async () => {
    try {
      const res: any = await fetchApiBodas({
        query: queries.removeGuests,
        variables: {
          eventID: event._id,
          guests: arrIDs,
        },
      });
      // api-mcp devuelve invitados_array bajo .evento (EventoBatchResponse).
      // Fallback a la lista vieja para no vaciar la tabla si viene null.
      const invitados_array = res?.evento?.invitados_array ?? res?.invitados_array
      setEvent((old) => ({
        ...old,
        invitados_array: invitados_array ?? old.invitados_array,
      }));
      dispatch({ type: "RESET_STATE" });
      toast("success", t("Invitado eliminado con exito"));
    } catch (error) {
      toast("error", t("Ha ocurrido un error"));
    }
  };

  const OptionList = [{ texto: "Eliminar", icono: "", funcion: eliminarTodo }];

  useEffect(() => {
    const { indeterminate } = getToggleAllRowsSelectedProps();
    if (refCheckbox?.current?.indeterminate) {
      refCheckbox.current.indeterminate = indeterminate;
    }
  }, [refCheckbox, arrIDs, getToggleAllRowsSelectedProps]);

  return (
    <div className="h-8 w-full grid grid-cols-12 items-center translate-x-[-8px] md:translate-x-[-16px]">
      <label className="relative w-full grid place-items-center col-span-1">
        <input
          type="checkbox"
          className="rounded-full text-primary focus:ring-primary border-gray-400 cursor-pointer"
          ref={refCheckbox}
          {...getToggleAllRowsSelectedProps()}
          onChange={handleChange}
          disabled={!isAllowed()}
          {...rest}
        />
      </label>
      {arrIDs.length === 0 ? (
        <div className="col-span-11">
          <p className="font-display text-sm md:text-sm text-gray-500 translate-x-[-8px] md:translate-x-[-22px]">
            {t("selectall")}
          </p>
        </div>
      ) : (
        <ul className="w-full h-full flex items-center col-span-11">
          {OptionList.map((item, idx) => (
            <li
              key={idx}
              className="cursor-pointer flex items-center gap-2 rounded-2xl border border-gray-300 px-4 hover:bg-gray-200 hover:text-white transition text-sm text-gray-500 font-display translate-x-[-8px] md:translate-x-[-16px]"
              onClick={item.funcion}
            >
              {item.icono}
              {item.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
