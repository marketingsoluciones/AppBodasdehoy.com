
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

  useMounted()
  useEffect(() => {
  }, [showFormEditar])

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
          <section id="areaDrag" className={`bg-base w-full h-full pt-2 md:py-0`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 ">
              <BlockTitle title={"Mesas y asientos"} />
            </motion.div>
            <div className="bg-base flex flex-col md:flex-row w-full fixed h-[calc(100%-208px)] md:h-[calc(100%-202px)] md:pt-4">
              <div className="w-full *bg-red md:w-[25%] h-[calc(40%-0px)] md:h-[100%]">
                <div className="bg-primary *md:hidden w-full h-10">
                  <SubMenu itemSelect={itemSelect} setItemSelect={setItemSelect} />
                </div>
                <div className="*bg-red flex w-[100%] h-[calc(100%-40px)] md:h-[100%] ">
                  <div className="bg-blue-500 flex flex-col h-[calc(100%)] w-full *md:w-1/4 *p-2 md:p-0 px-4 md:px-2 justify-start truncate transform transition duration-700">
                    <div className="bg-base w-[100%] h-[100%] md:h-[calc(48%-40px)]">
                      {itemSelect}
                    </div>
                    <div className="bg-yellow-500 w-[100%] h-[100%] md:h-[52%] hidden md:block">
                      invitados
                    </div>
                    {/* <div className={`${!showTables && 'hidden'} flex md:flex flex-col justify-start items-center transform transition duration-700`}>
                      {sect[0] && <BlockPanelMesas
                        setModelo={setModelo}
                        state={showForm}
                        set={setShowForm}
                      />}
                      {sect[1] && <BlockResumen InvitadoSentados={filterGuests?.sentados} />}
                    </div>
                    <div className="bg-yellow-200 w-full h-[calc(100%-258px)]">
                      {true && <BlockInvitados
                        set={setIsMounted}
                        InvitadoNoSentado={filterGuests?.noSentados}
                        setEditInv={setEditInv}
                        editInv={editInv}
                        setSelected={setSelected}
                      />}
                    </div> */}

                  </div>
                </div>
              </div>
              <div className="*bg-violet-700 pt-2 md:pt-0 md:block flex justify-center items-center md:w-3/4 h-[calc(60%-0px)] md:h-full ">
                <Prueba setShowTables={setShowTables} showTables={showTables} setShowFormEditar={setShowFormEditar} />
              </div>

            </div >
          </section >
          {/* <div className="md:hidden w-full h-[80px]" /> */}
          <style>
            {
              `
            section {
              height: calc(100vh - 9rem);
            }
          `}
          </style >
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
                <div className="w-full h-full grid place-items-center h-96">
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
