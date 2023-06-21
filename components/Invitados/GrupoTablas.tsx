import { useEffect, useRef, useState, FC, Dispatch, SetStateAction, cloneElement } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useRouter } from "next/router";
import { EventContextProvider } from "../../context";
import { api } from "../../api";
import DataTableFinal from "./DataTable";
import { BorrarInvitado, EditarInvitado } from "../../hooks/EditarInvitado";
import { CanceladoIcon, ConfirmadosIcon, DotsOpcionesIcon, PendienteIcon } from "../icons";
import { guests } from "../../utils/Interfaces";
import { DataTableGroupContextProvider, DataTableGroupProvider } from "../../context/DataTableGroupContext";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from "../../hooks/useToast";

interface propsDatatableGroup {
  GruposArray: string[];
  setSelected: Dispatch<SetStateAction<string>>;
  isMounted: boolean;
  setIsMounted: Dispatch<SetStateAction<boolean>>;
}

const DatatableGroup: FC<propsDatatableGroup> = ({ setSelected, isMounted, setIsMounted }) => {
  const { event, setEvent, invitadoCero, setInvitadoCero } = EventContextProvider();
  const [datas, setDatas] = useState<{ titulo: string; data: guests[] }[]>([]);

  useEffect(() => {
    setInvitadoCero(event?.invitados_array?.filter(elem => elem.rol === event?.grupos_array[0])[0]?.nombre)
  }, [event?.invitados_array, event?.grupos_array])

  useEffect(() => {
    const Datas = event?.grupos_array.reduce((acc, group) => {
      acc[group] = { titulo: group, data: [] };
      event.invitados_array.forEach(guest => {
        if (event.grupos_array.includes(guest.rol)) {
          if (guest.rol === group) {
            acc[group] = {
              titulo: group,
              data: acc[group]?.data
                ? [...acc[group]?.data, guest]
                : [guest],
            };
          }
        } else {
          acc["no asignado"] = {
            titulo: "no asignado",
            data: acc["no asignado"]?.data
              ? [...acc["no asignado"]?.data, guest]
              : [guest],
          };
        }
      })
      return acc
    }, {})

    const Data = event?.invitados_array.reduce((acc, invitado) => {
      event.grupos_array.forEach((group) => {
        acc[group] = { titulo: group, data: [] };
        if (event.grupos_array.includes(invitado.rol)) {
          if (invitado.rol === group) {
            acc[group] = {
              titulo: group,
              data: acc[group]?.data
                ? [...acc[group]?.data, invitado]
                : [invitado],
            };
          }
        }
      });

      if (!event.grupos_array.includes(invitado.rol)) {
        acc["no asignado"] = {
          titulo: "no asignado",
          data: acc["no asignado"]?.data
            ? [...acc["no asignado"]?.data, invitado]
            : [invitado],
        };
      }
      return acc;
    }, {});

    Datas && setDatas(Object.values(Datas));
  }, [event]);


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
              EditarInvitado(eventoID, invitado._id, reemplazar, value);
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
              className="flex justify-start items-center truncate py-2 pr-3"
              onClick={handleClick}
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
                  onClick={() => setShow(!show)}
                >
                  {cloneElement(dicc[value].icon, { className: "w-5 h-5" })}
                  {value}
                </button>

                <ul
                  className={`${show ? "block opacity-100" : "hidden opacity-0"
                    } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 -top-2 z-40`}
                >
                  {Lista.map((item, index) => {
                    return (
                      <li
                        key={index}
                        className="cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize"
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
        Header: "Mesa",
        accessor: "nombre_mesa",
        Cell: ({ value: initialValue, row, column: { id } }) => {
          const [value, setValue] = useState(initialValue);
          const [show, setShow] = useState(false);
          const [loading, setLoading] = useState(false);
          const router = useRouter();

          useEffect(() => {
            setLoading(false);
            updateMyData({
              rowID: row.original._id,
              columnID: id,
              reemplazar: "nombre_mesa",
              value: value,
              loading: loading,
              eventoID: event._id,
            });
            setLoading(true);
          }, [value]);

          return (
            <ClickAwayListener onClickAway={() => setShow(false)}>
              <div className="relative w-full flex justify-center items-center">
                {value.toLowerCase() == "no asignado" ? (
                  <button
                    onClick={() => router.push("/mesas")}
                    className="bg-tertiary font-display text-sm font-medium px-2rounded hover:text-gray-500 px-3 rounded-lg focus:outline-none"
                  >
                    Añadir mesa
                  </button>
                ) : (
                  <button
                    className="focus:outline-none font-display text-sm"
                    onClick={() => setShow(!show)}
                  >
                    {value}
                  </button>
                )}

                <ul
                  className={`${show ? "block" : "hidden"
                    } top-0 absolute mt-2 w-48 bg-white capitalize rounded-md  shadow-xl z-10 overflow-auto h-max max-h-40`}
                >
                  {event?.mesas_array?.map((mesa, index) => {
                    return (
                      <li
                        key={index}
                        className="cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-purple-600 hover:text-white"
                        onClick={() => {
                          setValue(mesa.nombre_mesa);
                          setShow(!show);
                        }}
                      >
                        {mesa?.nombre_mesa}
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

              await api.ApiBodas(params);
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
            <div className="w-full flex justify-end items-center relative">
              <span
                onClick={(e) => setShow(!show)}
                className={`cursor-pointer relative w-max rounded-lg text-sm text-gray-700 ${title === "no asignado" ? "hidden" : ""}`}
              >
                <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
              </span>
              <ClickAwayListener onClickAway={() => show && setShow(false)}>
                <ul
                  className={`${show ? "block" : "hidden"
                    } top-0 right-0 absolute w-max border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10`}
                >
                  {Lista.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => DeleteGroup()}
                      className="font-display text-sm cursor-pointer border-base border block px-4 py-2 text-xs text-gray-500 hover:text-gray-500 hover:bg-base"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </ClickAwayListener>
            </div>
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
                  (invitado) => invitado._id !== rowID
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
          const handleClick = (e) => {
            e.preventDefault();
            setShow(!show);
            // HandleRemove(row.row.original._id)
          };

          return (
            <div className="w-full flex justify-end items-center relative">
              <span
                onClick={(e) => handleClick(e)}
                className="cursor-pointer relative w-max rounded-lg text-sm text-gray-700"
              >
                <DotsOpcionesIcon className="text-gray-500 w-4 h-4" />
              </span>
              <ClickAwayListener onClickAway={() => show && setShow(false)}>
                <ul
                  className={`${show ? "block" : "hidden"
                    } top-0 left-0 absolute w-20 border border-base bg-white capitalize rounded-md overflow-hidden shadow-lg z-10`}
                >
                  {Lista.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={item.function}
                      className="font-display text-sm cursor-pointer border-base border block px-2 py-1 text-sm text-gray-500 hover:text-gray-300 hover:bg-base"
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
              </ClickAwayListener>
            </div>
          );
        },
      },
    ];
  };

  return (
    <DataTableGroupProvider>
      <div className="w-[200%] md:w-[100%]">
        <CheckBoxAll />

        {datas?.map((item, idx: number) => {
          return (
            <DataTableFinal
              key={idx}
              data={item.data}
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
    <div className="h-8 w-full grid grid-cols-12 items-center">
      <label className="relative w-full grid place-items-center">
        <input
          type="checkbox"
          className="rounded-full text-primary focus:ring-primary border-gray-400 cursor-pointer "
          ref={refCheckbox}
          {...getToggleAllRowsSelectedProps()}
          onChange={handleChange}
          {...rest}
        />
      </label>
      {arrIDs.length === 0 ? (
        <div className="col-span-11">
          <p className="font-display text-sm md:text-sm text-gray-500">
            Seleccionar todos
          </p>
        </div>
      ) : (
        <ul className="w-full h-full flex items-center col-span-11">
          {OptionList.map((item, idx) => (
            <li
              key={idx}
              className="cursor-pointer flex items-center gap-2 rounded-2xl border border-gray-300 px-4 hover:bg-gray-200 hover:text-white transition text-sm text-gray-500 font-display py-1"
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
