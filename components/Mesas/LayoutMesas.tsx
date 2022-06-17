import React, { Dispatch, FC, SetStateAction, useContext, useEffect, useState } from "react";
import useHover from "../../hooks/useHover";
import Draggable from "react-draggable";
import MesaComponent from "./MesaComponent";
import { api } from "../../api";
import { EventContextProvider } from "../../context";
import { BorrarIcon, EditarIcon } from "../icons";
import { useDrop } from "react-dnd";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import Tooltip from "../Utils/Tooltip";
import { guests, signalItem, table } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from "../../utils/Fetching";

interface propsLayoutMesas {
  AddInvitado: CallableFunction;
}

const LayoutMesas: FC<propsLayoutMesas> = ({ AddInvitado }) => {

  const { event, setEvent } = EventContextProvider();

  const [disableLayout, setDisableLayout] = useState<boolean>(false);

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "invitado",
    drop: (item: signalItem) => {
      console.log("HOLA MUNDO", item)
      item && AddInvitado({ ...item, nombre_mesa: "no asignado" }, setEvent);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  // Guardar en BD y estado nueva posicion de la mesa
  const ActualizarPosicion: CallableFunction = async ({
    x,
    y,
    index,
    mesaID,
  }: {
    x: number;
    y: number;
    index: number;
    mesaID: string;
  }): Promise<void> => {
    try {
      const result = fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          tableID: mesaID,
          variable: "posicion",
          value: { x, y },
        },
      });
      const nuevoArr = [...event?.mesas_array];
      nuevoArr[index].posicion[0] = { x, y };
      setEvent((old) => ({
        ...old,
        mesas_array: nuevoArr,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  // Calculadora de posicion de sillas (Grados °) en mesa redonda
  const DefinePosition: CallableFunction = (
    valor: number,
    mesa: { tipo: string | number }
  ): number[] | number => {
    if (mesa.tipo == "redonda") {
      let arr = [];
      let deg = 0;
      while (deg <= 359) {
        deg = deg + valor;
        arr.push(deg);
      }

      return arr;
    }
    if (mesa.tipo == 1) {
      return 0;
    }
  };

  return (
    <div className="w-full h-full col-span-9 wrapperLayout relative">
      <TransformWrapper disabled={disableLayout} limitToBounds={true}>
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <>
            <div className="flex items-start gap-3 absolute top-5 left-5">
              <div className="flex flex-col rounded-md w-max h-max bg-white z-40 shadow border border-gray-200  text-xl ">
                <button
                  className="px-2 py-1 text-gray-500 hover:text-gray-800"
                  onClick={() => zoomIn()}
                >
                  +
                </button>
                <button
                  className="px-2 py-1 text-gray-500 hover:text-gray-800"
                  onClick={() => zoomOut()}
                >
                  -
                </button>
              </div>
              <div className="flex flex-col rounded-full w-8 h-8 bg-white z-40 shadow border border-gray-200 top-5 left-5 text-lg items-center justify-center ">
                <button
                  className="px-2 py-1 text-gray-500 hover:text-gray-800"
                  onClick={() => resetTransform()}
                >
                  x
                </button>
              </div>
            </div>
            <TransformComponent wrapperClass="w-full h-full">
              <div className="w-full paper" >
                <div className="w-full h-full absolute top-0 left-0" ref={drop} />
                {event?.mesas_array?.map((mesa, index) => {
                  return (
                    <Table
                      key={mesa._id}
                      mesa={{ ...mesa, posicion: mesa.posicion[0] }}
                      setDisableLayout={setDisableLayout}
                      index={index}
                      AddInvitado={AddInvitado}
                      DefinePosition={DefinePosition}
                      ActualizarPosicion={ActualizarPosicion}
                    />
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default LayoutMesas;

const BlockValidacion = ({ mesaID, set, nombreMesa }) => {
  const { event, setEvent } = EventContextProvider();

  // Borrar mesa en BD y estado global
  const Aceptar = async () => {
    try {
      const params = {
        query: `mutation{
                  borraMesa(evento_id:"${event._id}",mesa_id:"${mesaID}") {
                    mesas_array{
                      _id
                      nombre_mesa
                      tipo
                      posicion {
                        x
                        y
                      }
                      cantidad_sillas
                    }
                  }
                }`,
        variables: {},
      };
      await api.ApiBodas(params);
    } catch (error) {
      console.log(error);
    } finally {
      const arrNuevo = event?.mesas_array.filter((mesa) => mesa._id !== mesaID);
      setEvent((old) => {
        old.invitados_array.forEach((invitado) => {
          if (invitado.nombre_mesa == nombreMesa) {
            invitado.nombre_mesa = "no asignado";
          }
        });

        return { ...old, mesas_array: arrNuevo };
      });
    }
  };

  const Cancelar = () => {
    set("");
  };

  return (
    <div className="bg-white w-max z-20 absolute shadow-lg rounded-xl font-display grid place-items-center p-4 gap-4">
      <p className="text-gray-500 text-center text-md">
        ¿Estas seguro de eliminar la mesa?
      </p>
      <div className="flex gap-10 justify-center items-center">
        <button
          onClick={Aceptar}
          className="focus:outline-none bg-green px-2 py-1 text-white rounded-lg transition hover:opacity-90 text-sm"
        >
          Aceptar
        </button>
        <button
          onClick={Cancelar}
          className="focus:outline-none bg-primary px-2 py-1 text-white rounded-lg transition hover:opacity-90 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const BotonEditar = ({ mesa }) => {
  return (
    <span
      className="hover:cursor-pointer font-display text-gray-500 cursor-pointer hover:text-gray-300 transition transform hover:scale-105 transition text-sm flex items-center justify-start gap-1"
      onClick={() => false}
    >
      <EditarIcon className="w-4 h-4" /> <p>Editar</p>
    </span>
  );
};

const BotonRotar = ({ mesa }) => {
  return (
    <div
      className="bg-gray-700 rounded-full p-2 text-white hover:bcursor-pointer"
      onClick={() => alert("rotar")}
    >
      Rotar
    </div>
  );
};

interface propsTable {
  mesa: table
  index: number,
  AddInvitado: CallableFunction
  DefinePosition: CallableFunction
  ActualizarPosicion: CallableFunction
  setDisableLayout: Dispatch<SetStateAction<boolean>>
}
const Table: FC<propsTable> = ({
  mesa,
  index,
  AddInvitado,
  DefinePosition,
  ActualizarPosicion,
  setDisableLayout,
}) => {
  const { event } = EventContextProvider();
  const [invitados, setInvitados] = useState([]);
  const [showOptions, setShowOptions] = useState<{ x: number, y: number } | null>(null)
  console.log("position", showOptions)

  useEffect(() => {
    setInvitados(
      event?.invitados_array?.filter(guest => guest.nombre_mesa === mesa.nombre_mesa)
    );
  }, [event?.invitados_array, mesa?.nombre_mesa]);

  return (
    <>
      <Draggable
        key={mesa._id}
        defaultPosition={mesa.posicion}
        defaultClassName="w-max"
        // bounds={".wrapperLayout"}
        cancel=".silla"
        onMouseDown={() => setDisableLayout(true)}
        onStop={(e, data) => {
          setDisableLayout(false);
          ActualizarPosicion({
            x: data.x,
            y: data.y,
            index: index,
            mesaID: mesa._id,
          });
        }}
      >
        <div onAuxClick={(e) => {
          console.log(e.target)
          setShowOptions({
            x: e.pageX,
            y: e.pageY
          })
        }} className="relative w-max">
          {showOptions && (
            <div className={`absolute bg-red-500 w-max top-[${400}px] left-[${showOptions.x}px]`}>
             {/*  hola mundo */}
            </div>
          )}
          {/* {validar && (
            <BlockValidacion
              nombreMesa={mesa.nombre_mesa}
              mesaID={validar}
              set={setValidar}
            />
          )}
          <div
            className={`scale-50 flex bg-secondary flex-col gap-3 items-start justify-center pl-3 absolute my-auto inset-y-0 h-20 w-28 rounded-lg left-20 transform transition duration-500 ${
              isHovered ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <span
              className="hover:cursor-pointer font-display text-gray-500 cursor-pointer hover:text-gray-300 transition transform hover:scale-105 transition text-sm flex items-center justify-start gap-1"
              onClick={() => setValidar(mesa._id)}
            >
              <BorrarIcon className="w-4 h-4" /> <p>Borrar</p>
            </span>

            <BotonEditar mesa={mesa} />
            {mesa.tipo > 0 && <BotonRotar mesa={mesa} />}
          </div> */}

          <div className=" absolute hover:bg-gray-100 hover:bg-opacity-50 hover:border hover:border-gray-200 hover:shadow-md p-4 rounded-2xl">
            <MesaComponent
              posicion={DefinePosition(360 / mesa.cantidad_sillas, mesa)}
              mesa={mesa}
              AddInvitado={AddInvitado}
              invitados={invitados}
            />
          </div>
        </div>
      </Draggable>
    </>
  );
};
