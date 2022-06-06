// Importaciones de dependencias
import React, { useContext, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

// Importaciones de contextos
import { EventContextProvider } from "../context";

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

const Mesas = () => {
  const { event, setEvent } = EventContextProvider();
  const [modelo, setModelo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [movil, setMovil] = useState(false);

  const InvitadoNoSentado = event?.invitados_array?.filter(
    (invitado) => invitado.nombre_mesa.toLowerCase() == "no asignado"
  );

  const InvitadoSentados = event?.invitados_array?.filter(
    (invitado) => invitado.nombre_mesa.toLowerCase() !== "no asignado"
  );

  useEffect(() => {
    window.innerWidth <= 768 && setMovil(true);
  }, []);

  // Añadir invitado | Carga en BD y estado
  const AddInvitado = async (item) => {
    if (item && item.tipo == "invitado") {
      try {
        async function Puesto() {
          const params = {
            query: `mutation {
                  editInvitado(evento_id:"${event._id}",invitado_id:"${item.invitado._id}",variable_reemplazar:"puesto",valor_reemplazar:"${item.index}") {
                    _id
                  }
                }`,
            variables: {},
          };
          const { data } = await api.ApiBodas(params);
        }

        Puesto();

        async function Mesa() {
          const params = {
            query: `mutation {
                  editInvitado(evento_id:"${event._id}",invitado_id:"${item.invitado._id}",variable_reemplazar:"nombre_mesa",valor_reemplazar:"${item.nombre_mesa}") {
                    _id
                  }
                }`,
            variables: {},
          };
          const { data } = await api.ApiBodas(params);
        }

        Mesa();
      } catch (error) {
        console.log(error);
      } finally {
        //Añadir al array de la mesa
        setEvent((old) => {
          const idx = old.invitados_array.findIndex(
            (el) => el._id == item.invitado._id
          );
          return {
            ...old,
            ...(old.invitados_array[idx].puesto = item.index),
            ...(old.invitados_array[idx].nombre_mesa = item.nombre_mesa),
          };
        });
      }
    }
  };

  return (
    <>
      {showForm ? (
        <ModalCrearMesa>
          <FormCrearMesa
            modelo={modelo}
            set={(act) => setShowForm(act)}
            state={showForm}
          />
        </ModalCrearMesa>
      ) : null}

      {shouldRenderChild && (
        <ModalLeft state={isMounted} set={(accion) => setIsMounted(accion)}>
          <FormInvitado
            ListaGrupos={event?.grupos_array}
            state={isMounted}
            set={(accion) => setIsMounted(accion)}
          />
        </ModalLeft>
      )}
      <div>
        <DndProvider backend={movil ? TouchBackend : HTML5Backend}>
          <section className={`w-full flex bg-base`}>
            <div
              className={`z-10 w-96 h-full bg-white box-border px-2 flex-col flex gap-6 transform transition duration-700 overflow-y-scroll overflow-x-hidden `}
            >
              <BlockPanelMesas
                modelo={(act) => setModelo(act)}
                state={showForm}
                set={(act) => setShowForm(act)}
              />
              <BlockResumen InvitadoSentados={InvitadoSentados} />
              <BlockInvitados
                AddInvitado={AddInvitado}
                set={(act) => setIsMounted(act)}
                InvitadoNoSentado={InvitadoNoSentado}
              />
            </div>
            <LayoutMesas
              AddInvitado={AddInvitado}
              evento={event}
              setEvento={setEvent}
            />
          </section>
        </DndProvider>
        <style jsx>
          {`
            section {
              min-height: calc(100vh - 9rem);
            }
          `}
        </style>
      </div>
    </>
  );
};

export default Mesas;
