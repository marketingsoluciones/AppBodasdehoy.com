import { useEffect, useRef, useState, FC, Dispatch, SetStateAction, cloneElement, useCallback } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useRouter } from "next/router";
import { EventContextProvider } from "../../context";
import { api } from "../../api";
import DataTableFinal from "./DataTable";
import { BorrarInvitado } from "../../hooks/EditarInvitado";
import { CanceladoIcon, ConfirmadosIcon, DotsOpcionesIcon, PendienteIcon, } from "../icons";
import { Event, guests, table } from "../../utils/Interfaces";
import { DataTableGroupContextProvider, DataTableGroupProvider, } from "../../context/DataTableGroupContext";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";
import { moveGuest } from "../Mesas/FuntionsDragable";
import { useAllowed } from "../../hooks/useAllowed";
import { LiaLinkSolid } from "react-icons/lia";
import { CopiarLink } from "../Utils/Compartir";
import { SubTabla } from "./SubTabla";
import DetallesPago from "../Presupuesto/DetallesPago";
import { IoIosArrowDown } from "react-icons/io";
import { Modal } from "../Utils/Modal";
import { DeleteConfirmation } from "../Itinerario/MicroComponente/DeleteConfirmation";

interface propsDatatableGroup {
  GruposArray: string[];
  setSelected: Dispatch<SetStateAction<string>>;
  isMounted: boolean;
  setIsMounted: Dispatch<SetStateAction<boolean>>;
  menu?: any[]
  setGetMenu?: any
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
}

export const handleMoveGuest = (props: handleMoveGuest) => {
  try {
    const { invitadoID, previousTable, lastTable, f1, event, setEvent, toast } = props
    if (previousTable?._id) {
      const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === previousTable?._id)
      const f3 = event.planSpace[f1].tables[f2].guests.findIndex(elem => elem._id === invitadoID)
      event.planSpace[f1].tables[f2].guests.splice(f3, 1)
      setEvent({ ...event })
      fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: event?.planSpace[f1]?._id,
          tableID: event.planSpace[f1].tables[f2]?._id,
          variable: "guests",
          valor: JSON.stringify([...event.planSpace[f1].tables[f2]?.guests])
        },
      });
      if (!lastTable) {
        toast("success", `El invitado no está sentado en ninguna mesa`,)
      }
    }
    if (lastTable) {
      for (let i = 0; i < lastTable?.numberChair; i++) {
        if (!lastTable?.guests?.map(el => el.chair).includes(i)) {
          if (lastTable) {
            const f2 = event?.planSpace[f1]?.tables?.findIndex(elem => elem._id === lastTable?._id)
            event.planSpace[f1].tables[f2].guests.push({ _id: invitadoID, chair: i, order: new Date() })
            setEvent({ ...event })
            fetchApiEventos({
              query: queries.editTable,
              variables: {
                eventID: event._id,
                planSpaceID: event?.planSpace[f1]?._id,
                tableID: event.planSpace[f1].tables[f2]?._id,
                variable: "guests",
                valor: JSON.stringify([...event.planSpace[f1].tables[f2]?.guests])
              },
            });
            toast("success", `El invitado fue sentado en la mesa; ${lastTable.title}, puesto: ${i + 1}`,)
          }
          break
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const DatatableGroup: FC<propsDatatableGroup> = ({ setSelected, isMounted, setIsMounted, menu = [] }) => {
  const toast = useToast()
  const { event, setEvent, invitadoCero, setInvitadoCero, allFilterGuests, planSpaceActive, setPlanSpaceActive, filterGuests } = EventContextProvider();
  const GuestsFathers = event?.invitados_array?.filter((invitado) => invitado?.father === null)
  const [data, setData] = useState<{ titulo: string; data: guestsExt[] }[]>([]);
  const [isAllowed] = useAllowed()
  const [acompañanteID, setAcompañanteID] = useState({ id: "", crear: true })
  const [modal, setModal] = useState({ state: false, title: null, handle: () => { } })

  useEffect(() => {
    setAcompañanteID(old => ({ ...old, crear: false }))
  }, [acompañanteID.id])

  useEffect(() => {
    setInvitadoCero(event?.invitados_array?.filter(elem => elem?.rol === event?.grupos_array[0])[0]?.nombre)
  }, [event?.invitados_array, event?.grupos_array])

  useEffect(() => {
    let asd = {}
    for (let i = 0; i < event?.grupos_array?.length; i++) {
      asd = { ...asd, [event?.grupos_array[i]]: { titulo: event?.grupos_array[i], data: [] } }
    }
    const tablesRecepcion = event?.planSpace.find(elem => elem?.title === "recepción")?.tables
    const tablesCeremonia = event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
    const Data = GuestsFathers.reduce((acc, item: guestsExt) => {
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

      if (event?.grupos_array?.includes(item?.rol)) {
        acc[item.rol] = { titulo: item.rol, data: acc[item.rol]?.data ? [...acc[item.rol]?.data, item] : [item] }
      } else {
        acc["no asignado"] = { titulo: "no asignado", data: acc["no asignado"]?.data ? [...acc["no asignado"]?.data, item] : [item] }
      }
      return acc;
    }, asd);
    Data && setData(Object.values(Data));
  }, [allFilterGuests]);

  const renderRowSubComponent = useCallback(({ row }) => (
    <SubTabla row={row} getId={acompañanteID?.id} />
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
              fetchApiEventos({
                query: queries.editGuests,
                variables: {
                  eventID: event._id,
                  guestID: invitado._id,
                  variable: reemplazar,
                  value: value
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
      console.log(error);
    }
  };


  //Definir Columnas
  const CrearColumna = (title) => {
    return [
      {
        Header: () => {
          return (
            <h3 className=" text-gray-500 text-left truncate capitalize font-medium">
              {title}
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
        Header: "Asistencia",
        accessor: "asistencia",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue ?? "No asignado");
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
                  {cloneElement(dicc[value].icon, { className: "w-5 h-5" })}
                  {value}
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
                        {item.title}
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
        Header: "Menu",
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
                  {value}
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
                        {item?.nombre_menu}
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
                    {"sin menú"}
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: "Mesa recepción",
        accessor: "tableNameRecepcion",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue);
          const [show, setShow] = useState(false);
          const router = useRouter();
          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full flex justify-center items-center">
                {/*value?.toLowerCase() == "no asignado"*/ false ? (
                  <button
                    onClick={() => router.push("/mesas")}
                    className="bg-tertiary font-display text-sm font-medium hover:text-gray-500 *px-3 rounded-lg focus:outline-none"
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
                    ...event?.planSpace.find(elem => elem?.title === "recepción")?.tables
                  ]?.map((elem: any, index) => {
                    if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) {
                      return (
                        <li
                          key={index}
                          className={`${(value._id === elem._id || (!value._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                          onClick={() => {
                            const f1 = event?.planSpace.findIndex(elem => elem?.title === "recepción")
                            const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                            setShow(!show);
                            if (value?._id || elem?._id) {
                              if (value?._id !== elem?._id) {
                                setValue(elem.title);
                                handleMoveGuest({ invitadoID: row.original._id, previousTable: value, lastTable: table, f1, event, setEvent, toast })
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
                    className="*bg-gray-300 cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
                    onClick={() => router.push("/mesas")}
                  >
                    Añadir mesa
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: "Mesa Ceremonia",
        accessor: "tableNameCeremonia",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue);
          const [show, setShow] = useState(false);
          const router = useRouter();

          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full flex justify-center items-center">
                {/*value?.toLowerCase() == "no asignado"*/ false ? (
                  <button
                    onClick={() => router.push("/mesas")}
                    className="bg-tertiary font-display text-sm font-medium px-2rounded hover:text-gray-500 px-3 rounded-lg focus:outline-none"
                  >
                    Añadir mesa
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
                    ...event?.planSpace.find(elem => elem?.title === "ceremonia")?.tables
                  ]?.map((elem: any, index) => {
                    if (elem?.guests?.length < elem?.numberChair || value?._id === elem?._id || !elem?._id) {
                      return (
                        <li
                          key={index}
                          className={`${(value._id === elem._id || (!value._id && !elem._id)) && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                          onClick={() => {
                            const f1 = event?.planSpace.findIndex(elem => elem?.title === "ceremonia")
                            const table = event.planSpace[f1]?.tables.find(el => el._id === elem._id)
                            setShow(!show);
                            if (value?._id || elem?._id) {
                              if (value?._id !== elem?._id) {
                                setValue(elem.title);
                                handleMoveGuest({ invitadoID: row.original._id, previousTable: value, lastTable: table, f1, event, setEvent, toast })
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
                    Añadir mesa
                  </li>
                </ul>
              </div>
            </ClickAwayListener>
          );
        },
      },
      {
        Header: "Acompañantes",
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
            event.showChildrenGuest = !props?.row?.isExpanded ? props.row.original._id : null
            setEvent({ ...event })
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
          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
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
                    <CopiarLink evento_id={event._id} invitado_id={row.original._id} />
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
              const params = {
                query: `mutation {
                  borraGrupo(evento_id:"${event._id}",nombre_grupo:"${title}"){
                    _id
                  }
                }`,
                variables: {},
              };

              await api.ApiApp(params);
            } catch (error) {
              console.log(error);
            } finally {
              setEvent((old) => ({
                ...old,
                grupos_array: old.grupos_array.filter((e) => e !== title),
              }));
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
                      onClick={() => DeleteGroup()}
                      className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base"
                    >
                      {item}
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
              console.log(error);
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
          //gvp*hqx7xgf.PWP0xky
          //miki.ibarra@vivetuboda.com

          return (
            <>
              {modal.state && <Modal classe={"w-[95%] md:w-[450px] h-[200px]"}>
                <DeleteConfirmation setModal={setModal} modal={modal} />
              </Modal>}
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
                              title: <span>
                                <strong>
                                  {`${row.row.cells[0].value} `}
                                </strong>
                                <span>{`${!row.row.cells[5].value
                                  ? "será borrado"
                                  : row.row.cells[5].value === 1
                                    ? `y su acompañante serán borrados`
                                    : `y sus ${row.row.cells[5].value} acompañantes serán borrados`
                                  } de la lista de invitados`}
                                </span>
                              </span>,
                              handle: () => item.function()
                            })
                            : item.function()
                        }
                        }
                        className="font-display cursor-pointer border-base border block px-4 text-sm text-gray-500 hover:text-gray-500 hover:bg-base py-3"
                      >
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div >
              </ClickAwayListener >
            </>
          );
        },
      },
    ];
  };

  return (
    <DataTableGroupProvider>
      <div className="w-[200%] md:w-[100%]">
        {/* <CheckBoxAll /> */}
        {data?.map((item, idx: number) => {
          return (
            <DataTableFinal
              key={idx}
              data={item.data}
              renderRowSubComponent={renderRowSubComponent}
              columns={CrearColumna(!item.titulo.match("(nombre)") ? item.titulo : item.titulo.replace("(nombre)", invitadoCero ? invitadoCero : event?.grupos_array[0]))}
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
  const refCheckbox: any = useRef();
  const [isAllowed, ht] = useAllowed()

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
      const { invitados_array }: any = await fetchApiEventos({
        query: queries.removeGuests,
        variables: {
          eventID: event._id,
          guests: arrIDs,
        },
      });
      setEvent((old) => ({
        ...old,
        invitados_array,
      }));
      dispatch({ type: "RESET_STATE" });
      toast("success", "Invitado eliminado con exito");
    } catch (error) {
      console.log(error);
      toast("error", "Ha ocurrido un error");
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
            Seleccionar todos
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
