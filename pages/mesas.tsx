// Importaciones de dependencias OLD
//import React, { useContext, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
// Importaciones de dependencias NEW
import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from "react";
//import { DndProvider } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch'
// Importaciones de contextos
import { AuthContextProvider, EventContextProvider } from "../context";
// Importaciones de componentes
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalCrearMesa from "../components/Mesas/ModalCrearMesa";
import LayoutMesas from "../components/Mesas/LayoutMesas";
import { useDelayUnmount } from "../utils/Funciones";
import ModalLeft from "../components/Utils/ModalLeft";
import FormInvitado from "../components/Forms/FormInvitado";
import { api } from "../api";
import Breadcumb from "../components/DefaultLayout/Breadcumb";
import { Event, guests } from "../utils/Interfaces";
import { fetchApiEventos, queries } from "../utils/Fetching";
import VistaSinCookie from "./vista-sin-cookie";
import SwiperCore, { Pagination, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from "swiper/react";
import Prueba from "./prueba";
SwiperCore.use([Pagination]);

const Mesas: FC = () => {
  const { event, setEvent } = EventContextProvider();
  const [modelo, setModelo] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [filterGuests, setFilterGuests] = useState<{ sentados: guests[], noSentados: guests[] }>({ sentados: [], noSentados: [] })
  const [movil, setMovil] = useState(false);
  const [visible, setVisible] = useState<boolean>(true)

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

  // Añadir invitado | Carga en BD y estado
  const AddInvitado = async (item: { tipo: string, invitado: guests, index: number, nombre_mesa: string }, set: Dispatch<SetStateAction<Event>>): Promise<void> => {
    if (item && item.tipo == "invitado") {
      try {
        if (item.index) {
          fetchApiEventos({
            query: queries.editGuests,
            variables: {
              eventID: event._id,
              guestID: item.invitado._id,
              variable: "puesto",
              value: item?.index?.toString()
            }
          })
        }

        if (item.nombre_mesa) {
          fetchApiEventos({
            query: queries.editGuests,
            variables: {
              eventID: event._id,
              guestID: item.invitado._id,
              variable: "nombre_mesa",
              value: item.nombre_mesa
            }
          })

        }

        console.log(item, set)
        //Añadir al array de la mesa
        set(oldEvent => {
          const modifiedGuests: guests[] = oldEvent.invitados_array.map(invitado => {
            if (invitado._id === item.invitado._id) {
              console.log("ENTRE")
              return { ...invitado, puesto: item.index, nombre_mesa: item.nombre_mesa }
            }
            return invitado
          })
          return { ...oldEvent, invitados_array: modifiedGuests }
        })

      } catch (error) {
        console.log(error);
      }
    }
  }
  const { user, verificationDone } = AuthContextProvider()
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    return (
      <>
        {showForm ? (
          <ModalCrearMesa set={setShowForm} state={showForm}>
            <FormCrearMesa
              modelo={modelo}
              set={setShowForm}
              state={showForm}
            />
          </ModalCrearMesa>
        ) : null}

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
            <DndProvider backend={movil ? TouchBackend : HTML5Backend}>
              <section className={`w-full grid md:grid-cols-12 bg-base overflow-hidden`}>

                <div className="flex md:hidden h-[calc(250px)] flex-col ">
                  <div className="p-2 px-4">
                    <Swiper
                      pagination={{ clickable: true }}
                      navigation
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
                    >
                      <SwiperSlide className="flex flex-col justify-start items-center cursor-pointer ">
                        <div className=" w-[calc(100vw-30px)] ">
                          <BlockPanelMesas
                            setModelo={setModelo}
                            state={showForm}
                            set={setShowForm}
                          />
                        </div>
                        <BlockResumen InvitadoSentados={filterGuests?.sentados} />

                      </SwiperSlide>

                      <SwiperSlide className="flex flex-col justify-start items-center cursor-pointer ">
                        <BlockInvitados
                          AddInvitado={AddInvitado}
                          set={setIsMounted}
                          InvitadoNoSentado={filterGuests?.noSentados}
                        />
                      </SwiperSlide>
                    </Swiper>
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
                  <Prueba />
                  {/* <LayoutMesas
                    AddInvitado={AddInvitado}
                  /> */}
                </div>

              </section>
            </DndProvider>
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
