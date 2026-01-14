import { FC, useEffect, useMemo, useState, useRef } from "react";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import { getCurrency } from "../../utils/Funciones";
import { LiaPaperclipSolid } from "react-icons/lia";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/useToast";
import { UsuariosCompartidos } from "../Utils/Compartir";
import { IoShareSocial } from "react-icons/io5";
import { OpenModal } from "./OpenModal";
import { TbLock } from "react-icons/tb";
import { GoArrowUpRight } from "react-icons/go";
import { FaSearch } from "react-icons/fa"; // Importa el ícono de lupa
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

export const EventsTable: FC<any> = () => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, setUser, config } = AuthContextProvider()
  const { setEvent } = EventContextProvider();
  const router = useRouter();
  const toast = useToast()
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState({ state: false, data: {}, idx: null })
  const [activeHeader, setActiveHeader] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "usuario_nombre", "estatus", "nombre", "tipo", "estilo", "color", "tarta", "temporada", "tematica", "fecha", "fecha_creacion", "invitados_array", "detalles_compartidos_array", "itinerarios_array", "menus_array", "presupuesto_objeto"
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId) // Oculta la columna
        : [...prev, columnId] // Muestra la columna
    );
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setActiveHeader(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputRef]);

  const columns = useMemo(
    () => [
      {
        Header: t("estado"),
        accessor: "estatus",
        id: "estatus",
        Cell: (data) => {
          return (
            <span className="flex items-center capitalize"> {data.value != null ? data.value : ""}</span>
          )
        }
      },
      {
        Header: t("owner"),
        accessor: "usuario_nombre",
        id: "usuario_nombre",
        Cell: (data) => {
          return (
            <span className="flex items-center capitalize"> {data.value != null ? data.value : ""}</span>
          )
        }
      },
      {
        Header: t("nameevent"),
        accessor: "nombre",
        id: "nombre",
        Cell: (data) => {
          const handleClickCard = ({ t, final = true, data, user, setUser, config, setEvent, router }) => {
            try {
              fetchApiBodas({
                query: queries.updateUser,
                variables: {
                  uid: user?.uid,
                  variable: "eventSelected",
                  valor: data?._id
                },
                development: config?.development
              })
              user.eventSelected = data?._id
              setUser(user)
            } catch (error) {
              console.log(error);
            } finally {
              if (final) {
                if (data?.permissions) {
                  const permissions = data?.permissions?.filter(elem => ["view", "edit"].includes(elem.value))
                  if (permissions.length) {
                    const f1 = permissions.findIndex(elem => elem.value === "resumen")
                    if (f1 > -1) {
                      setEvent(data);
                      router.push("/resumen-evento");
                    } else {
                      setEvent(data);
                      let p = permissions[0].title
                      if (p === "regalos") p = "lista-regalos"
                      if (p === "resumen") p = "resumen-evento"
                      router.push("/" + p);
                    }
                  } else {
                    return t("No tienes permiso, contactar al organizador del evento")
                  }
                } else {
                  setEvent(data);
                  router.push("/resumen-evento");
                }
              }
            }
          };
          return (
            <span onClick={() => {
              const resp = handleClickCard({ t, final: true, config, data: data.data[data.cell.row.id], setEvent, user, setUser, router })
              if (resp) toast("warning", resp)
            }} className="flex items-center capitalize cursor-pointer justify-between w-full">
              {data.value != null ? data.value : "null"}
              <GoArrowUpRight />
            </span>
          )
        }
      },
      {
        Header: t("type"),
        accessor: "tipo",
        id: "tipo",
        Cell: (data) => {
          return (
            <span className="flex items-center capitalize"> {data.value != null ? data.value : ""}</span>
          )
        }
      },
      {
        Header: t("title"),
        accessor: "estilo",
        id: "estilo",
        Cell: (data) => {
          return (
            <span className="flex items-center capitalize"> {data.value != null ? data.value : ""}</span>
          )
        }
      },
      {
        Header: "color",
        accessor: "color",
        id: "color",
        Cell: (data) => {
          const list = [
            { color: "bg-yellow-300	", title: "Amarillo" },
            { color: "bg-cyan-400	", title: "Celeste" },
            { color: "bg-pink-400", title: "Rosado" },
            { color: "bg-red", title: "Rojo" },
            { color: "bg-purple-600", title: "Morado" },
            { color: "bg-amber-100	", title: "Beige" },
            { color: "bg-yellow-500", title: "Dorado" },
            { color: "bg-slate-400", title: "Plata" },
            { color: "bg-orange-400", title: "Naranja" },
            { color: "bg-lime-600", title: "verde" },
          ]
          const colorFind = list.find((elem) => elem.title === data.value[0])
          return (
            <div className={`flex w-full items-center justify-center capitalize  `}>
              {data.value.length > 0 ?
                <span className={`${colorFind?.color} flex w-full* items-center capitalize text-white  p-1 rounded-md text-[10px] `}>
                  {colorFind?.title + " +" + (data.value.length - 1)}
                </span> :
                <span className={`bg-gray-400 flex w-full* items-center capitalize text-white  p-1 rounded-md text-[10px]`}>
                  null
                </span>}
            </div>
          )
        }
      },
      {
        Header: "tarta",
        accessor: "tarta",
        id: "tarta",
        Cell: (data) => {
          return (
            <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? <LiaPaperclipSolid className="h-5 w-5" /> : ""} </span>
          )
        }
      },
      {
        Header: "temporada",
        accessor: "temporada",
        id: "temporada",
        Cell: (data) => {
          return (
            <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? data.value : ""} </span>
          )
        }
      },
      {
        Header: "tematica",
        accessor: "tematica",
        id: "tematica",
        Cell: (data) => {
          return (
            <span className="flex items-center justify-center w-full capitalize"> {data.value != null ? data.value : ""} </span>
          )
        }
      },
      {
        Header: t("eventdate"),
        accessor: "fecha",
        id: "fecha",
        Cell: (data) => {
          return (
            <div className="flex w-full justify-center items-center capitalize">
              {data.value != null ? `${new Date(parseInt(data.value)).toLocaleDateString("es-VE", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}` : ""}
            </div>
          )
        }
      },
      {
        Header: t("creationdate"),
        accessor: "fecha_creacion",
        id: "fecha_creacion",
        Cell: (data) => {
          return (
            <div className="flex w-full justify-center items-center capitalize">
              {data.value != null ? `${new Date(parseInt(data.value)).toLocaleDateString("es-VE", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}` : ""}
            </div>
          )
        }
      },
      {
        Header: t("invitado"),
        accessor: "invitados_array",
        id: "invitados_array",
        Cell: (data) => {
          return (
            <div className="flex w-full items-center justify-end capitalize">
              {data.value.length > 0 ? data.value.length : ""}
            </div>
          )
        }
      },
      {
        Header: t("compartidos"),
        accessor: "detalles_compartidos_array",
        id: "detalles_compartidos_array",
        Cell: (data) => {
          console.log(data.data[data.cell.row.id].usuario_id === user?.uid)
          return (
            <div onClick={() => {
              data.data[data.cell.row.id]?.usuario_id === user?.uid &&
                setOpenModal({ state: true, data: data.data[data.cell.row.id], idx: data.cell.row.id })
            }} className=" w-full capitalize">
              {
                data.value.length > 0 ?
                  <UsuariosCompartidos event={data.data[data.cell.row.id]} /> :
                  data.data[data.cell.row.id]?.usuario_id === user?.uid ?
                    <div className="flex items-center justify-center">
                      <IoShareSocial className={`w-6 h-6 cursor-pointer text-gray-500 ${user?.displayName !== "guest" && "hover:text-gray-300"} `} />
                    </div> :
                    <div className="flex items-center justify-center cursor-default">
                      <TbLock className={`w-6 h-6  text-gray-500  `} />
                    </div>

              }
            </div>
          )
        }
      },
      {
        Header: t("Itinerary"),
        accessor: "itinerarios_array",
        id: "itinerarios_array",
        Cell: (data) => {
          return (
            <div className="flex w-full items-center justify-end capitalize">
              {data.value.length > 0 ? data.value.length : ""}
            </div>
          )
        }
      },
      {
        Header: "menus",
        accessor: "menus_array",
        id: "menus_array",
        Cell: (data) => {
          return (
            <div className="flex w-full items-center justify-end capitalize">
              {data.value.length > 0 ? data.value.length : ""}
            </div>
          )
        }
      },
      /* {
        Header: "mesas",
        accessor: "mesas_array",
        id: "mesas_array",
        Cell: (data) => {
          return (
            <div className="flex w-full items-center justify-center capitalize">
              {data.value.length > 0 ? data.value.length : "null"}
            </div>
          )
        }
      }, */
      {
        Header: "presupuesto",
        accessor: "presupuesto_objeto",
        id: "presupuesto_objeto",
        Cell: (data) => {
          return (
            <div className="flex w-full items-center justify-end capitalize">
              {data.value != null ? getCurrency(data.value.coste_estimado, data.value.currency) : ""}
            </div>
          )
        }
      },
    ], [t]
  )

  useEffect(() => {
    let filteredData = eventsGroup;

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        filteredData = filteredData.filter((item) => {
          const value = item[key];
          if (key === "fecha" || key === "fecha_creacion") {
            // Convertir fechas a cadenas de texto
            return new Date(parseInt(value)).toLocaleDateString("es-VE", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).toLowerCase().includes(filters[key].toLowerCase());
          } else if (key === "presupuesto_objeto") {
            // Convertir montos de dinero a cadenas de texto
            return getCurrency(value.coste_estimado, value.currency).toLowerCase().includes(filters[key].toLowerCase());
          } else {
            return value?.toString().toLowerCase().includes(filters[key].toLowerCase());
          }
        });
      }
    });

    setData(filteredData);
  }, [eventsGroup, filters]);

  useEffect(() => {
    setData(eventsGroup)
  }, [eventsGroup])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy, useRowSelect);

  const colSpan = {
    estatus: 2,
    usuario_nombre: 4,
    color: 3,
    nombre: 4,
    tipo: 3,
    estilo: 3,
    fecha: 3,
    fecha_creacion: 3,
    invitados_array: 2,
    tarta: 3,
    temporada: 2,
    tematica: 3,
    itinerarios_array: 2,
    menus_array: 3,
    mesas_array: 2,
    presupuesto_objeto: 4,
    detalles_compartidos_array: 4
  };

  return (
    <div className="relative px-3 flex flex-col justify-center w-full">


      {openModal?.state && <OpenModal openModal={openModal} setOpenModal={setOpenModal} />}
      <table
        {...getTableProps()}
        className="table-auto border-collapse rounded-lg relative p-4 w-full">
        <thead className="relative text-xs text-gray-700 uppercase bg-gray-200 w-full truncate">
          {headerGroups.map((headerGroup: any, id: any) => {
            return (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                className="grid grid-cols-48 w-full truncate"
                key={id}
              >
                {headerGroup.headers.map((column: any, id: any) => {
                  const searchableColumns = ["usuario_nombre", "nombre", "tipo", "fecha", "fecha_creacion", "presupuesto_objeto", "estatus"];
                  if (!visibleColumns.includes(column.id)) return null;
                  return (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={`truncate w-full leading-[1] px-1 py-1 md:py-3 text-center flex justify-center items-center text-xs font-light font-display col-span-${colSpan[column.id]
                        }`}
                      key={id}
                    >
                      <div className="truncate w-full text-center">
                        {typeof column.render("Header") == "string" && t(column.render("Header"))}
                      </div>
                      <span>
                        {column.isSorted ? (column.isSortedDesc ? <FaArrowDown /> : <FaArrowUp />) : ""}
                      </span>
                      {searchableColumns.includes(column.id) && (
                        <FaSearch
                          className="ml-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHeader(activeHeader === column.id ? null : column.id);
                          }}
                        />
                      )}
                      {activeHeader === column.id && (
                        <div className="absolute top-full w-auto bg-white shadow-lg border rounded mt-1 z-50">
                          <input
                            ref={inputRef}
                            type="text"
                            value={filters[column.id] || ""}
                            onChange={(e) => setFilters({ ...filters, [column.id]: e.target.value })}
                            className="p-2 border rounded w-full"
                            placeholder={`Buscar ${t(column.render("Header"))}`}
                          />
                        </div>
                      )}
                      {/* Botón de filtro de columnas, solo en el último header */}
                      {id === headerGroup.headers.length - 1 && (
                        <div className="absolute right-0 top-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(!dropdownOpen);
                            }}
                            className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"
                          >

                            <svg xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5 text-gray-700"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.294A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.03l1.25.834a6.957 6.957 0 0 1 1.416-.587l.294-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
                            </svg>

                            {/*       <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-gray-700"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.75v10.5m5.25-5.25H6.75"
        />
      </svg> */}
                          </button>
                          {dropdownOpen && id === headerGroup.headers.length - 1 && ( // Dropdown solo para el último header
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-10">
                              {columns.map((column) => (
                                <div
                                  key={column.id}
                                  className="flex hover:bg-basePage items-center px-4 py-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(column.id)}
                                    onChange={() => handleColumnToggle(column.id)}
                                    className="mr-2"
                                  />
                                  {t(column.Header)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}


              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()} className="text-gray-700 text-xs bg-white">
          {rows.length >= 1 ? rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                key={i}
                className={` w-full border-b font-display grid grid-cols-48 truncate`}
              >
                {row.cells.map((cell, i) => {
                  if (!visibleColumns.includes(cell.column.id)) return null;
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={i}
                      className={`flex items-center* leading-[2] px-1 py-1 col-span-${colSpan[cell.column.id]} border-x-[1px] truncate`}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          }) : <tr className="transition border-b border-base hover:bg-base cursor-pointer w-full grid place-items-center">
            <td className="bg-redpy-5 font-display text-lg text-gray-500 uppercase "></td></tr>}
        </tbody>
      </table>
    </div>
  );
};