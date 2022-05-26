// Importaciones de dependencias
import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from "react";
import { DndProvider } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch'
import { EventContextProvider } from "../context";
import FormCrearMesa from "../components/Forms/FormCrearMesa";
import BlockPanelMesas from "../components/Mesas/BlockPanelMesas";
import BlockResumen from "../components/Mesas/BlockResumen";
import BlockInvitados from "../components/Mesas/BlockInvitados";
import ModalCrearMesa from "../components/Mesas/ModalCrearMesa";
import { useDelayUnmount } from "../utils/Funciones";
import FormInvitado from "../components/Forms/FormInvitado";
import { Event, guests } from "../utils/Interfaces";
import { fetchApiEventos, queries } from "../utils/Fetching";
import ModalLeft from "../components/utils/ModalLeft";
import LayoutMesas from '../components/Mesas/LayoutMesas';

const Mesas : FC = () => {
  const { event, setEvent } = EventContextProvider();
  const [modelo, setModelo] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [filterGuests, setFilterGuests] = useState<{sentados: guests[], noSentados: guests[]}>({sentados: [], noSentados: []})

  useEffect(() => {
    setFilterGuests(event?.invitados_array?.reduce((acc, guest) => {
      if(event?.mesas_array?.map(table => table.nombre_mesa).includes(guest.nombre_mesa)){
        acc.sentados.push(guest)
      } else {
        acc.noSentados.push(guest)
      }
      return acc
    }, {sentados: [], noSentados: []}))
  }, [event?.invitados_array, event?.mesas_array])
  


  // Añadir invitado | Carga en BD y estado
const AddInvitado = async (item: {tipo: string, invitado: guests, index: number, nombre_mesa: string}, set : Dispatch<SetStateAction<Event>>) : Promise<void> => {
    if (item && item.tipo == "invitado") {
      try {
        if(item.index){
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

        if(item.nombre_mesa){
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
            if(invitado._id === item.invitado._id){
              console.log("ENTRE")
              return {...invitado, puesto: item.index, nombre_mesa: item.nombre_mesa}
            }
            return invitado
        })
          return {...oldEvent, invitados_array : modifiedGuests}
        })

      } catch (error) {
        console.log(error);
      }
    }
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
      <DndProvider backend={HTML5toTouch}>
          <section className={`w-full grid md:grid-cols-12 bg-base overflow-hidden`}>
            <div
              className={`hidden md:flex z-10 h-full col-span-3 box-border px-2 flex-col  gap-6 transform transition duration-700 overflow-y-auto `}
            >
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
            <LayoutMesas
              AddInvitado={AddInvitado}
            />
          </section>
          </DndProvider>
        <style jsx>
          {`
            section {
              height: calc(100vh - 9rem);
            }
          `}
        </style>
      </div>
    </>
  );
};

export default Mesas;
