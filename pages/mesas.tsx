
import React, { FC, useEffect, useRef, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../context";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas, { ListTables } from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalMesa from "../components/Mesas/ModalMesa";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import VistaSinCookie from "./vista-sin-cookie";
import SwiperCore, { Pagination, Navigation } from 'swiper';
import Prueba from "../components/Mesas/prueba";
import FormEditarMesa from "../components/Forms/FormEditarMesa";
import BlockTitle from "../components/Utils/BlockTitle";
import { useMounted } from "../hooks/useMounted"
import ModalBottomSinAway from "../components/Utils/ModalBottomSinAway";
import FormEditarInvitado from "../components/Forms/FormEditarInvitado";
import { motion } from "framer-motion";
import { SubMenu } from "../components/Utils/SubMenu";
import BlockPlanos from "../components/Mesas/BlockPlanos";
import { setupDropzone } from "../components/Mesas/FuntionsDragable";
import BlockPanelElements, { ListElements } from "../components/Mesas/BlockPanelElements";
import { fetchApiEventos, queries } from "../utils/Fetching";
import { useToast } from "../hooks/useToast";
import BlockPlantillas from "../components/Mesas/BlockPlantillas";
import { useRouter } from "next/router";


SwiperCore.use([Pagination]);

const Mesas: FC = () => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests, allFilterGuests, setEditDefault } = EventContextProvider();
  const [values, setValues] = useState<any>({});
  const [showFormCreateTable, setShowFormCreateTable] = useState<boolean>(false);
  const [showFormEditar, setShowFormEditar] = useState<any>({ table: {}, visible: false });
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [editInv, setEditInv] = useState(false)
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const [itemSelect, setItemSelect] = useState("mesas")
  const [fullScreen, setFullScreen] = useState<boolean>(false)
  const [creaElement, setCreaElement] = useState<boolean>(false)
  const [forCms, setForCms] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    setForCms(router?.query?.show === "iframe")
  }, [router])

  const toast = useToast()
  useMounted()

  const handleOnDrop = (values: any) => {
    setValues(values)
    if (values.tipo === "table") {
      setShowFormCreateTable(true)
    }
    if (values.tipo === "element") {
      setCreaElement(true)
    }
  }

  useEffect(() => {
    if (creaElement) {
      const element = ListElements.find(elem => elem.title === values.modelo)
      try {
        const inputValues = {
          position: { x: (values.offsetX - element.size.width / 2).toFixed(0), y: (values.offsetY - element.size.height / 2).toFixed(0) },
          tipo: values.modelo,
          rotation: 0
        }
        fetchApiEventos({
          query: queries.createElement,
          variables: {
            eventID: event._id,
            planSpaceID: planSpaceActive._id,
            values: JSON.stringify({ ...inputValues })
          },
        }).then((result: any) => {
          planSpaceActive.elements.push({ ...result })
          setPlanSpaceActive({ ...planSpaceActive })
          event.planSpace[event.planSpaceSelect] = planSpaceActive
          setEvent({ ...event })
          setCreaElement(false)
        })
      } catch (err) {
        toast("error", "Ha ocurrido al añadir el objeto")
        console.log(err);
      }
    }
  }, [creaElement])

  useEffect(() => {
    const defaultTablesDraggable = ListTables.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    const defaultElementsDraggable = ListElements.map(elem => `#dragN${elem.title}_${elem.tipo}`)
    setupDropzone({ target: '.js-dropTables', accept: `${[...defaultTablesDraggable, ...defaultElementsDraggable]}`, handleOnDrop, setEvent, eventID: event?._id, planSpaceActive, setPlanSpaceActive })
  }, [planSpaceActive])

  useEffect(() => {
    if (allFilterGuests) {
      setFilterGuests(allFilterGuests[event?.planSpace?.findIndex(elem => elem._id === planSpaceActive._id)])
    }
  }, [allFilterGuests])

  useEffect(() => {
    if (!showFormEditar) {
      setEditDefault(old => { return { ...old, activeButtons: true } })
    }
  }, [showFormEditar])

  const { user, verificationDone } = AuthContextProvider()
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }

    if (!event) return <></>
    return (
      <div className={forCms && `w-full h-full absolute top-0 left-0 `}>
        {/* formulario emergente para crear mesas */}
        {showFormCreateTable ? (
          <ModalMesa set={setShowFormCreateTable} state={showFormCreateTable} title="Añadir mesa">
            <FormCrearMesa
              values={values}
              set={setShowFormCreateTable}
              state={showFormCreateTable}
            />
          </ModalMesa>
        ) : null}
        {/* formulario emergente para editar mesas */}
        {showFormEditar.visible ? (
          <ModalMesa set={setShowFormEditar} state={showFormEditar} title={`Mesa: "${showFormEditar.table.title}"`}>
            <FormEditarMesa
              set={setShowFormEditar}
              state={showFormEditar}
            />
          </ModalMesa>
        ) : null}
        {/* formulario emergente para agregar un invitado */}
        {shouldRenderChild && (
          <ModalLeft state={isMounted} set={setIsMounted}>
            <FormInvitado
              state={isMounted}
              set={setIsMounted}
            />
          </ModalLeft>
        )}
        <div className="font-display">
          <section id="areaDrag" className={`w-full h-full pt-2 md:py-0 static`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 ">
              {!forCms && <BlockTitle title={"Mesas y asientos"} />}
            </motion.div>
            <div className={`${fullScreen || forCms ? "absolute z-[50] w-[100vw] h-[100vh] top-0 left-0" : "w-full h-[calc(100vh-208px)] md:h-[calc(100vh-210px)] md:mt-2"}`}>


              <div className={`flex flex-col md:flex-row w-full items-center h-full`}>
                <div className={`w-[calc(100%-0px)] mt-2 md:mt-0 ${fullScreen ? " md:w-[23%] h-[calc(30%-8px)]" : " md:w-[25%] h-[calc(30%-8px)]"} md:h-[100%] flex flex-col items-center truncate`}>
                  <div className="bg-primary rounded-t-lg md:rounded-none w-[100%] ] h-10 ">
                    <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                  </div>
                  <div className={`bg-base flex w-[100%] h-[calc(100%-40px)]`} >
                    <div className="flex flex-col h-[100%] w-full md:px-2 justify-start truncate transform transition duration-700">
                      <div className={`bg-white w-[100%] h-[100%] my-1 ${fullScreen ? "md:h-[30%] 2xl:h-[25%]" : "md:h-[40%] 2xl:h-[25%] rounded-lg shadow-lg"}`}>
                        {itemSelect == "invitados" &&
                          <BlockInvitados set={setIsMounted} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
                        }
                        {itemSelect == "mesas" &&
                          <BlockPanelMesas />
                        }
                        {itemSelect == "mobiliario" &&
                          <BlockPanelElements />
                        }
                        {itemSelect == "zonas" &&
                          <span>En desarrollo!</span>
                          // <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "planos" &&
                          <BlockPlanos />
                        }
                        {itemSelect == "plantillas" &&
                          <BlockPlantillas />
                        }
                        {itemSelect == "resumen" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                      </div>
                      <div className={`w-[100%] h-[100%] ${fullScreen ? "md:h-[calc(70%-16px)] 2xl:h-[calc(75%-16px)]" : "md:h-[calc(60%-16px)] 2xl:h-[calc(75%-16px)]"} hidden md:block`}>
                        {true && <BlockInvitados
                          set={setIsMounted}
                          setEditInv={setEditInv}
                          editInv={editInv}
                          setSelected={setSelected}
                        />}
                      </div>
                    </div>
                  </div>
                </div>
                { /* */}<div className={`bg-base  pt-2 md:pt-0 md:block flex justify-center items-center w-full ${fullScreen ? "md:w-[77%]" : "md:w-[75%]"} h-[calc(70%-0px)] md:h-[100%]`}>
                  <Prueba setShowFormEditar={setShowFormEditar} fullScreen={fullScreen} setFullScreen={setFullScreen} />
                </div>

              </div >
            </div>
          </section >
          {/* <div className="md:hidden w-full h-[80px]" /> */}
        </div >
        <ModalBottomSinAway state={editInv} set={setEditInv}>
          <div className="flex justify-center w-full gap-6">
            <div className="w-full md:w-5/6">
              <div className="border-l-2 border-gray-100 pl-3 my-6 w-full ">
                <h2 className="font-display text-2xl capitalize text-primary font-light">
                  Editar <br />
                  <span className="font-display text-4xl capitalize text-gray-500 font-medium">
                    Invitado
                  </span>
                </h2>
              </div>
              {invitadoSelected !== null ? (
                <FormEditarInvitado
                  //ListaGrupos={event?.grupos_array}
                  invitado={event.invitados_array.find(
                    (guest) => guest._id === invitadoSelected
                  )}
                  setInvitadoSelected={setSelected}
                  state={editInv}
                  set={setEditInv}
                />
              ) : (
                <div className="w-full h-96 grid place-items-center">
                  {" "}
                  <p className="font-display text-lg ">
                    No hay invitado seleccionado
                  </p>
                </div>
              )}
            </div>
          </div>
        </ModalBottomSinAway>
      </div>
    );
  }
};

export default Mesas;
