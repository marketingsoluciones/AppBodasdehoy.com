
import React, { FC, useEffect, useRef, useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../context";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas from "../components/Mesas/BlockPanelMesas";
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


SwiperCore.use([Pagination]);

const Mesas: FC = () => {
  const { event } = EventContextProvider();
  const [modelo, setModelo] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showFormEditar, setShowFormEditar] = useState<any>({ mesa: {}, visible: false });
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [filterGuests, setFilterGuests] = useState<{ sentados: guests[], noSentados: guests[] }>({ sentados: [], noSentados: [] })
  const [showTables, setShowTables] = useState<boolean>(true)
  const [editInv, setEditInv] = useState(false)
  const [invitadoSelected, setSelected] = useState<string | null>(null);
  const [sect, setSect] = useState([false, false, false, false])
  const [itemSelect, setItemSelect] = useState("mesas")
  const [fullScreen, setFullScreen] = useState<boolean>(false)


  useMounted()




  useEffect(() => {
    if (window?.innerWidth > 768)
      setSect([true, true, true, true])
  }, [])


  useEffect(() => {
    setFilterGuests(event?.invitados_array?.reduce((acc, guest) => {
      if (event?.mesas_array?.map(table => table.nombre_mesa).includes(guest.nombre_mesa)) {
        acc.sentados.push(guest)
      } else {
        acc.noSentados.push(guest)
      }
      return acc
    }, { sentados: [], noSentados: [] }))
  }, [event?.invitados_array, event?.mesas_array])

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
              modelo={modelo}
              set={setShowForm}
              state={showForm}
            />
          </ModalMesa>
        ) : null}
        {/* formulario emergente para editar mesas */}
        {showFormEditar.visible ? (
          <ModalMesa set={setShowFormEditar} state={showFormEditar} title={`Mesa: "${showFormEditar.mesa.nombre_mesa}"`}>
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
          <section id="areaDrag" className={`bg-base w-full h-full pt-2 md:py-0 static`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 ">
              <BlockTitle title={"Mesas y asientos"} />
            </motion.div>
            <div className={`${fullScreen ? "absolute z-[1000] w-[100vw] h-[100vh] top-0 left-0" : "w-full h-[calc(100vh-208px)] md:h-[calc(100vh-210px)] md:mt-2"}`}>


              <div className={`flex flex-col md:flex-row w-full items-center h-full`}>
                { /* */}<div className={`w-[calc(100%-40px)] mt-2 md:mt-0 ${fullScreen ? " md:w-[23%] h-[calc(30%-8px)]" : " md:w-[25%] h-[calc(30%-8px)]"} md:h-[100%] flex flex-col items-center truncate`}>
                  <div className="bg-primary rounded-t-lg md:rounded-none w-[100%] ] h-10 ">
                    <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                  </div>
                  <div className={`bg-base flex w-[100%] h-[calc(100%-40px)]`} >
                    <div className="flex flex-col h-[100%] w-full md:px-2 justify-start truncate transform transition duration-700">
                      <div className={`bg-white w-[100%] h-[100%] mb-2 ${fullScreen ? "md:h-[30%] 2xl:h-[25%]" : "md:h-[40%] 2xl:h-[25%] rounded-b-lg shadow-lg"}`}>
                        {itemSelect == "invitados" &&
                          <BlockInvitados set={setIsMounted} InvitadoNoSentado={filterGuests?.noSentados} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
                        }
                        {itemSelect == "mesas" &&
                          <BlockPanelMesas setModelo={setModelo} state={showForm} set={setShowForm} />
                        }
                        {itemSelect == "mobiliario" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "zonas" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "plantilla" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                        {itemSelect == "resumen" &&
                          <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                        }
                      </div>
                      <div className={`w-[100%] h-[100%] ${fullScreen ? "md:h-[calc(70%-16px)] 2xl:h-[calc(75%-16px)]" : "md:h-[calc(60%-16px)] 2xl:h-[calc(75%-16px)]"} hidden md:block`}>
                        {true && <BlockInvitados
                          set={setIsMounted}
                          InvitadoNoSentado={filterGuests?.noSentados}
                          setEditInv={setEditInv}
                          editInv={editInv}
                          setSelected={setSelected}
                        />}
                      </div>
                    </div>
                  </div>
                </div>
                { /* */}<div className={`bg-cyan-200 pt-2 md:pt-0 md:block flex justify-center items-center w-full ${fullScreen ? "md:w-[77%]" : "md:w-[75%]"} h-[calc(70%-0px)] md:h-[100%]`}>
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
