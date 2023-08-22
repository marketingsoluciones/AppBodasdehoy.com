import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { api } from "../api";
import FormCrearCategoria from "../components/Forms/FormCrearCategoria";
import FormEditarCategoria from "../components/Forms/FormEditarCategoria";
import { CochinoIcon, DineroIcon, DotsOpcionesIcon, PlusIcon } from "../components/icons";
import BlockCategoria from "../components/Presupuesto/BlockCategoria";
import BlockPagos from "../components/Presupuesto/BlockPagos";
import Grafico from "../components/Presupuesto/Grafico";
import ModalLeft from "../components/Utils/ModalLeft";
import { AuthContextProvider, EventContextProvider } from "../context";
import { getCurrency, useDelayUnmount } from "../utils/Funciones";
import VistaSinCookie from "./vista-sin-cookie";
import BlockTitle from "../components/Utils/BlockTitle";
import { useToast } from "../hooks/useToast";
import { useMounted } from "../hooks/useMounted"

const Presupuesto = () => {

  useMounted()
  const [showCategoria, setShowCategoria] = useState({
    isVisible: false,
    id: "",
  });

  const [active, setActive] = useState(true);
  const { event } = EventContextProvider();
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    setCategorias(event?.presupuesto_objeto?.categorias_array)
  }, [event])

  useEffect(() => {
    const condicion = event?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == showCategoria.id)
    condicion == -1 && setShowCategoria({ isVisible: false, id: "" })
  }, [event?.presupuesto_objeto?.categorias_array, showCategoria?.id])

  const { user, verificationDone } = AuthContextProvider()
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <>
        {event &&
          <section className="bg-base w-full h-full pb-16 pt-2 md:py-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full">
              <BlockTitle title={"Presupuesto"} />
              <div className="pt-2">
                <div className="w-80 mx-auto inset-x-0 flex my-2 mt-2 rounded-2xl overflow-hidden">
                  <div
                    onClick={() => setActive(true)}
                    className={`w-1/2 py-1 ${active ? "bg-primary text-white" : "bg-white text-primary"
                      } h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                  >
                    <p>Presupuesto</p>
                  </div>
                  <div
                    onClick={() => setActive(false)}
                    className={`w-1/2 py-1 ${active ? "bg-white text-primary" : "bg-primary text-white"
                      } h-full grid place-items-center font-display font-medium text-sm cursor-pointer hover:opacity-90`}
                  >
                    <p>Pagos</p>
                  </div>
                </div>
              </div>
              {active ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid md:grid-cols-3 w-full gap-6 pt-2 pl-3 pr-3 md:pr-0 pb-4"
                >
                  <>
                    <BlockListaCategorias
                      set={(act) => setShowCategoria(act)}
                      categorias_array={categorias}
                    />

                    <div className="md:col-span-2 w-full flex flex-col relative">
                      {showCategoria?.isVisible ? (
                        <BlockCategoria
                          set={(act) => setShowCategoria(act)}
                          cate={showCategoria?.id}
                        />
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className=" bg-white shadow-md rounded-xl grid place-items-center p-4">
                              <MontoPresupuesto
                                estimado={
                                  event?.presupuesto_objeto?.coste_estimado
                                }
                              />
                            </div>
                            <div className=" bg-white shadow-md rounded-xl grid place-items-center p-4">
                              <DineroIcon className="w-12 h-12 text-primary " />
                              <p className="font-display text-gray-500 font-light text-md grid place-items-center">
                                Coste Final <br />
                                <span className="font-semibold text-lg text-center">
                                  {getCurrency(
                                    event?.presupuesto_objeto?.coste_final
                                  )}
                                </span>
                              </p>
                              <div className=" w-full rounded-xl overflow-hidden flex my-2">
                                <div className="w-1/2 bg-primary py-1 px-3">
                                  <p className="text-xs font-display text-white">
                                    Pagado {event?.presupuesto_objeto?.pagado} €
                                  </p>
                                </div>

                                <div className="w-1/2 bg-tertiary py-1 px-3">
                                  <p className="text-xs font-display text-primary">
                                    Por pagar {event?.presupuesto_objeto?.coste_final - event?.presupuesto_objeto?.pagado} €
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-full pt-2">
                            <h2 className="font-display pb-2 text-xl text-gray-500 font-semibold text-center w-full">
                              ¿Cuanto cuesta mi evento?
                            </h2>
                            <Grafico categorias={categorias} />
                          </div>
                        </>
                      )}
                    </div>
                  </>
                </motion.div>
              ) : (
                <BlockPagos />
              )}
            </motion.div>
          </section>}
        <style jsx>
          {`
          section {
            min-height: calc(100vh - 9rem);
          }
        `}
        </style>
      </>
    );
  }
};

export default Presupuesto;

const MontoPresupuesto = ({ estimado }) => {
  const [modificar, setModificar] = useState(false);
  const [value, setValue] = useState(estimado.toFixed(2));
  const [mask, setMask] = useState();
  const { event, setEvent } = EventContextProvider()

  useEffect(() => {
    setMask(getCurrency(!!value ? value : 0, "EUR"));
  }, [value]);

  const handleChange = (e) => {
    e.preventDefault();
    const r = e.target.value?.split(".")
    setValue(parseFloat(!!r[1] ? `${r[0]}.${r[1]?.slice(0, 2)}` : e.target.value));
  };

  const keyDown = (e) => {
    let tecla = e.key.toLowerCase();
    (tecla == "enter" || tecla == " ") && handleBlur();
  };

  const handleBlur = async () => {
    const params = {
      query: `mutation {
        editPresupuesto(evento_id:"${event._id}", coste_estimado:${!!value ? value : 0}  ){
          coste_final
          coste_estimado
          pagado
          categorias_array {
            _id
            coste_proporcion
            coste_estimado
            coste_final
            pagado
            nombre
            gastos_array{
              _id
              coste_proporcion
              coste_estimado
              coste_final
              pagado
              nombre
              pagos_array {
                _id
                estado
                fecha_creacion
                fecha_pago
                fecha_vencimiento
                medio_pago
                importe
              }
            }
          }
        }
      }`,
      variables: {},
    }
    let datos;
    try {
      const { data } = await api.ApiApp(params)
      datos = data.data.editPresupuesto
    } catch (error) {
      console.log(error)
    } finally {
      setModificar(false)
      setEvent(old => ({ ...old, presupuesto_objeto: datos }))
    }

  }
  return (
    <>
      <CochinoIcon className="w-12 h-12 text-gray-500 " />
      <p className="font-display text-gray-500 font-light text-md grid place-items-center">
        Presupuesto estimado <br />
      </p>
      {modificar ? (
        <input
          type="number"
          min={0}
          value={!!value ? value : ""}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e)}
          onKeyDown={(e) => keyDown(e)}
          className="font-display appearance-none text-gray-500 font-semibold text-lg text-center border-b w-1/2 focus:outline-none border-gray-200"
        />
      ) : (
        <span className="font-display text-gray-500 font-semibold text-lg text-center">
          {mask}
        </span>
      )}
      <button
        onClick={() => setModificar(!modificar)}
        className="border-primary border font-display focus:outline-none text-primary text-xs bg-white px-3 py-1 rounded-lg my-2 hover:bg-primary hover:text-white transition"
      >
        {modificar ? "Aceptar" : "Modificar presupuesto"}
      </button>
      <style jsx>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}
      </style>
    </>
  );
};

// Componente para mostrar todas las categorias
const BlockListaCategorias = ({ categorias_array, set }) => {
  const [isMounted, setIsMounted] = useState([false, ""]);
  const shouldRenderChild = useDelayUnmount(isMounted[0], 500);
  const [categorias, setCategorias] = useState([]);
  const { event, setEvent } = EventContextProvider()
  const [colorText, setColorText] = useState(event?.presupuesto_objeto?.coste_estimado == 0 ? "text-gray-300" : "text-gray-500");
  const Presu = event?.presupuesto_objeto?.coste_estimado

  useEffect(() => {
    setCategorias(categorias_array)
  }, [categorias_array])

  useEffect(() => {
    if (event?.presupuesto_objeto?.coste_estimado != 0) {
      setColorText("text-gray-500")
    }
  }, [event?.presupuesto_objeto?.coste_estimado])

  const Forms = {
    crear: <FormCrearCategoria
      state={isMounted}
      set={(accion) => setIsMounted(accion)}
    />,
    editar: <FormEditarCategoria
      categoria={isMounted[2]}
      state={isMounted}
      set={(accion) => setIsMounted(accion)}
    />,

  }

  return (
    <>
      {shouldRenderChild && (
        <ModalLeft state={isMounted[0]} set={(accion) => setIsMounted(accion)}>
          {Forms[isMounted[1]]}
        </ModalLeft>
      )}
      <div className="bg-white w-full shadow-md rounded-xl h-max ">
        <button
          onClick={() => setIsMounted([true, "crear"])}
          className="focus:outline-none bg-primary rounded-xl font-display font-light text-md flex gap-2 w-full transform py-1 items-center justify-center text-white hover:scale-105 transition transform"
        >
          <PlusIcon className="text-white w-4 h-4" />
          Nueva Categoria
        </button>
        <ul className={`w-full flex flex-col font-display text-sm h-44 overflow-y-auto md:h-max divide-y ${colorText} ${Presu == 0 ? "cursor-not-allowed*" : "cursor-pointer"}`}>
          {categorias?.map((item, idx) => (
            <ItemCategoria key={idx} item={item} setVisible={act => set(act)}
              set={(accion) => setIsMounted(accion)} />
          ))}
        </ul>
      </div>
      <style jsx>
        {`
        div {
          height: max-content
        }
        `}
      </style>
    </>
  );
};


// Componente hijo para lista de categorias
const ItemCategoria = ({ item, setVisible, set }) => {
  const { event, setEvent } = EventContextProvider()
  const [show, setShow] = useState(false);
  const toast = useToast()
  const Presu = event?.presupuesto_objeto?.coste_estimado


  const BorrarCategoria = async () => {
    setShow(!show)
    const params = {
      query: `mutation{
          borraCategoria(evento_id:"${event?._id}",
          categoria_id: "${item?._id}"){
            coste_final
          }
        }
        `,
      variables: {},
    };
    try {
      await api.ApiApp(params)
    } catch (error) {
      console.log(error)
    } finally {
      setEvent(old => {
        old.presupuesto_objeto.categorias_array = old?.presupuesto_objeto?.categorias_array?.filter(elemento => elemento._id !== item._id)
        return { ...old }
      })
    }
  }

  const EditarCategoria = () => {
    setShow(!show)
    set([true, "editar", item])
  }

  const DefinirCoste = (item) => {
    if (item.coste_final >= item.coste_estimado) {
      return item.coste_final
    } else {
      return item.coste_estimado
    }
  }

  const Lista = [
    { title: "Editar", function: EditarCategoria },
    { title: "Borrar", function: BorrarCategoria }
  ];

  return (
    <li onClick={() => Presu != 0 ? setVisible({ isVisible: true, id: item._id }) : toast("error", "Agrega un monto a tu Presupuesto Estimado ")} className={`w-full justify-between items-center flex   px-5  transition ${Presu == 0 ? "" : "hover:bg-base"}`}>
      <span
        className="gap-2 py-3 flex items-center capitalize"
      >
        {item?.icon}
        {item?.nombre?.toLowerCase()}
      </span>
      <span className="gap-4 flex items-center py-3 md:py-0" >
        <div >
          {getCurrency(DefinirCoste(item))}
        </div>
        <div className="relative ">
          <DotsOpcionesIcon
            onClick={() => Presu != 0 ? setShow(!show) : null}
            className={`w-3 h-3 ${Presu != 0 ? "cursor-pointer" : ""} `}
          />
          {show && (
            <ClickAwayListener onClickAway={() => show && setShow(false)}>
              <ul className="w-max z-20 bg-white shadow-md rounded absolute top-0 right-0 font-display text-sm divide-y ">
                {Lista.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => item.function()}
                    className="px-2 py-1 hover:bg-base transition "
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            </ClickAwayListener>
          )}
        </div>
      </span>
    </li>
  );
};
