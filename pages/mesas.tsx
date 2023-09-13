
import React, { FC, useEffect, useRef, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../context";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas, { ListaMesas } from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalMesa from "../components/Mesas/ModalMesa";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import Breadcumb from "../components/DefaultLayout/Breadcumb";
import { guests } from "../utils/Interfaces";
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
import BlockDefault from "../components/Mesas/BlockDefault";
import BlockPlanos from "../components/Mesas/BlockPlanos";
import { setupDropzone } from "../components/Mesas/FuntionsDragable";


SwiperCore.use([Pagination]);

const Mesas: FC = () => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, setFilterGuests } = EventContextProvider();
  const [modelo, setModelo] = useState<string | null>(null);
  const [values, setValues] = useState<any>({});
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showFormEditar, setShowFormEditar] = useState<any>({ table: {}, visible: false });
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [showTables, setShowTables] = useState<boolean>(true)
  const [editInv, setEditInv] = useState(false)
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const [sect, setSect] = useState([false, false, false, false])
  const [itemSelect, setItemSelect] = useState("mesas")
  const [fullScreen, setFullScreen] = useState<boolean>(false)

  const handleOnDrop = (values: any) => {
    setValues(values)
    setShowForm(true)
  }

  useMounted()

  useEffect(() => {
    const defaultMesasDraggable = ListaMesas.map(elem => `#dragN${elem.title}`)
    setupDropzone({ target: '.js-dropTables', accept: `${defaultMesasDraggable}`, handleOnDrop, setEvent, eventID: event?._id, planSpaceActive, setPlanSpaceActive })
  }, [planSpaceActive])


  useEffect(() => {
    if (window?.innerWidth > 768)
      setSect([true, true, true, true])
  }, [])


  useEffect(() => {
    if (planSpaceActive) {
      const guestsSections = planSpaceActive?.sections?.reduce((sections, section) => {
        const guestsSection = section?.tables?.reduce((tables, table) => {
          if (table?.guests?.length > 0) {
            const asd = table.guests.map(elem => {
              return {
                guestID: elem._id,
                planSpaceID: planSpaceActive._id,
                sectionID: undefined,
                tableID: table._id,
                chair: elem.chair,
                order: elem.order,
              }
            })
            tables = [...tables, asd]
          }
          return tables
        }, [])
        sections.push(...guestsSection)
        return sections
      }, [])
      const guestsTables = planSpaceActive?.tables?.reduce((tables, table) => {
        if (table?.guests?.length > 0) {
          const asd = table.guests.map(elem => {
            return {
              guestID: elem._id,
              planSpaceID: planSpaceActive._id,
              sectionID: undefined,
              tableID: table._id,
              chair: elem.chair,
              order: elem.order,
            }
          })
          tables = [...tables, ...asd]
        }
        return tables
      }, [])
      const guestsSentados = [...guestsSections, ...guestsTables]
      const guestsSentadosIds = guestsSentados.map(elem => elem.guestID)
      const filterGuest = event?.invitados_array?.reduce((acc, item) => {
        if (guestsSentadosIds?.includes(item._id)) {
          const guest = guestsSentados.find(elem => elem.guestID === item._id)
          acc.sentados.push({
            ...item,
            ...guest
          })
          return acc
        }
        acc.noSentados.push(item)
        return acc
      }, { sentados: [], noSentados: [] })
      setFilterGuests(filterGuest)
    }
  }, [planSpaceActive, event])

  useEffect(() => {
    console.log(10004, "filterGuests", filterGuests)
  }, [filterGuests])

  useEffect(() => {
    console.log(10005, showFormEditar)
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
      <>
        {/* formulario emergente para crear mesas */}
        {showForm ? (
          <ModalMesa set={setShowForm} state={showForm} title="Añadir mesa">
            <FormCrearMesa
              values={values}
              set={setShowForm}
              state={showForm}
            />
          </ModalMesa>
        ) : null}
        {/* formulario emergente para editar mesas */}
        {showFormEditar.visible ? (
          <ModalMesa set={setShowFormEditar} state={showFormEditar} title={`Mesa: "${showFormEditar.table.title}"`}>
            <FormEditarMesa
              modelo={modelo}
              set={setShowFormEditar}
              state={showFormEditar}
              InvitadoNoSentado={filterGuests?.noSentados}

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
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 ">
              <BlockTitle title={"Mesas y asientos"} />
            </motion.div>
            <div className={`${fullScreen ? "absolute z-[50] w-[100vw] h-[100vh] top-0 left-0" : "w-full h-[calc(100vh-208px)] md:h-[calc(100vh-210px)] md:mt-2"}`}>


              <div className={`flex flex-col md:flex-row w-full items-center h-full`}>
                { /* */}<div className={`w-[calc(100%-40px)] mt-2 md:mt-0 ${fullScreen ? " md:w-[23%] h-[calc(30%-8px)]" : " md:w-[25%] h-[calc(30%-8px)]"} md:h-[100%] flex flex-col items-center truncate`}>
                  <div className="bg-primary rounded-t-lg md:rounded-none w-[100%] ] h-10 ">
                    <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                  </div>
                  <div className={`bg-base flex w-[100%] h-[calc(100%-40px)]`} >
                    <div className="flex flex-col h-[100%] w-full md:px-2 justify-start truncate transform transition duration-700">
                      <div className={`bg-white w-[100%] h-[100%] mb-2 ${fullScreen ? "md:h-[30%] 2xl:h-[25%]" : "md:h-[40%] 2xl:h-[25%] rounded-b-lg shadow-lg"}`}>
                        {itemSelect == "invitados" &&
                          <BlockInvitados set={setIsMounted} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
                        }
                        {itemSelect == "mesas" &&
                          <BlockPanelMesas setModelo={setModelo} state={showForm} set={setShowForm} />
                        }
                        {itemSelect == "mobiliario" &&
                          <span>En desarrollo!</span>
                          // <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "zonas" &&
                          <span>En desarrollo!</span>
                          // <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "planos" &&
                          <BlockPlanos />
                        }
                        {itemSelect == "plantilla" &&
                          <span>En desarrollo!</span>
                          // <BlockResumen InvitadoSentados={filterGuests?.sentados} />
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
                  <Prueba setShowTables={setShowTables} showTables={showTables} setShowFormEditar={setShowFormEditar} fullScreen={fullScreen} setFullScreen={setFullScreen} />
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
      </>
    );
  }
};

export default Mesas;
