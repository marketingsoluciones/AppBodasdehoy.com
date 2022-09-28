// Importaciones de dependencias OLD
//import React, { useContext, useEffect, useState } from "react";
// Importaciones de dependencias NEW
import React, { FC, useEffect, useRef, useState } from "react";
//import { DndProvider } from 'react-dnd-multi-backend';
// Importaciones de contextos
import { AuthContextProvider, EventContextProvider } from "../context";
// Importaciones de componentes
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalCrearMesa from "../components/Mesas/ModalCrearMesa";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import Breadcumb from "../components/DefaultLayout/Breadcumb";
import { Event, guests } from "../utils/Interfaces";
import VistaSinCookie from "./vista-sin-cookie";
import SwiperCore, { Pagination, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from "swiper/react";
import Prueba from "../components/Mesas/prueba";
import { AddInvitado } from "../components/Mesas/FuntionsDragable";
import PruebaN from "./prueban";
import { InvitadoPrueba } from "../components/Mesas/InvitadoPrueba";
SwiperCore.use([Pagination]);

const Mesas: FC = () => {
  const navigationPrevRef = useRef(null)
  const navigationNextRef = useRef(null)
  const { event } = EventContextProvider();
  const [modelo, setModelo] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [filterGuests, setFilterGuests] = useState<{ sentados: guests[], noSentados: guests[] }>({ sentados: [], noSentados: [] })
  const [showTables, setShowTables] = useState<boolean>(true)

  /*useEffect(() => {
    window.innerWidth <= 768 && setMovil(true);
  }, []);
  console.log(window.innerWidth, movil)*/

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
    return (
      <>
        {/* formulario emergente para crear mesas */}
        {showForm ? (
          <ModalCrearMesa set={setShowForm} state={showForm}>
            <FormCrearMesa
              modelo={modelo}
              set={setShowForm}
              state={showForm}
            />
          </ModalCrearMesa>
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
        <div>
          <div className="">
            <section id="areaDrag" className={`w-full grid md:grid-cols-12 bg-base overflow-hidden`}>
              {/* <div ref={navigationPrevRef} className="flex z-50 bg-red items-center absolute top-0 bottom-0 left-0 right-auto cursor-pointer">
                hoooooola
              </div>
              <div ref={navigationNextRef} className="flex z-50 bg-red items-center absolute top-0 bottom-0 left-auto right-0 cursor-pointer">
                hoooooooooola
              </div> */}
              <div className="flex md:hidden h-[calc(250px)] flex-col ">

                <div className="p-2 px-4">
                  {/* <div id="pdrag1" className="bg-red js-dragInvitadoN w-[50px] h-[50px]"
                    onTouchStart={(e) => {
                      //e.preventDefault()
                      console.log(e.touches[0].clientX, e.touches[0].clientY)
                      const rootElement = document.getElementById('areaDrag');
                      const element = document.createElement('div');
                      element.textContent = 'Hello word';
                      element.className = 'bg-red absolute z-50';
                      element.id = `dragM${"invitado._id"}`
                      element.style.left = e.touches[0].clientX + 10 + 'px'
                      element.style.top = e.touches[0].clientY + 10 + 'px'
                      element.setAttribute('data-x', (e.touches[0].clientX + 10).toString())
                      element.setAttribute('data-y', (e.touches[0].clientY + 10).toString())
                      rootElement.appendChild(element)
                    }}
                    onTouchEnd={() => {
                      const rootElement = document.getElementById('areaDrag');
                      const element = document.getElementById(`dragM${"invitado._id"}`)
                      element && rootElement.removeChild(document.getElementById(`dragM${"invitado._id"}`))
                    }}></div> */}
                  {/* <PruebaN /> */}
                  {/* <InvitadoPrueba /> */}
                  {/* <Swiper
                    pagination={{ clickable: true }}
                    tabIndex={1}
                    navigation={{
                      prevEl: navigationPrevRef.current,
                      nextEl: navigationNextRef.current,
                    }}
                    spaceBetween={20}
                    breakpoints={{
                      0: {
                        "slidesPerView": 1,
                      },
                      1024: {
                        "slidesPerView": 3,
                      },
                    }}
                    className="w-[calc(100vw-30px)] h-[calc(250px)] justify-start items-center"
                  > */}
                  <div className="w-[calc(100vw-30px)] h-[calc(250px)] justify-start items-center truncate">
                    <div className={`${!showTables && 'hidden'} flex flex-col justify-start items-center transform transition duration-700`}>
                      <div className=" w-[calc(100vw-30px)] ">
                        <BlockPanelMesas
                          setModelo={setModelo}
                          state={showForm}
                          set={setShowForm}
                        />
                      </div>
                      <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                    </div>
                    <div className={`${showTables && 'hidden'} flex flex-col justify-start items-center transform transition duration-700`}>
                      <BlockInvitados
                        AddInvitado={AddInvitado}
                        set={setIsMounted}
                        InvitadoNoSentado={filterGuests?.noSentados}
                      />
                    </div>
                  </div>
                  {/* </Swiper> */}
                </div>
              </div>
              <div className={`hidden md:flex h-full col-span-3 box-border px-2 flex-col gap-6 transform transition duration-700 overflow-y-auto`}>
                <Breadcumb />
                <BlockPanelMesas
                  setModelo={setModelo}
                  state={showForm}
                  set={setShowForm}
                />
                <BlockResumen InvitadoSentados={filterGuests?.sentados} />
                <BlockInvitados
                  AddInvitado={AddInvitado}
                  set={setIsMounted}
                  InvitadoNoSentado={filterGuests?.noSentados}
                />
              </div>
              <div className="pt-2 md:pt-0 md:block flex justify-center items-center ">
                <Prueba setShowTables={setShowTables} showTables={showTables} />
              </div>
            </section>
          </div>
          <style>
            {`
            section {
              height: calc(100vh - 9rem);
            }
          `}
          </style>
        </div>
      </>
    );
  }
};

export default Mesas;
