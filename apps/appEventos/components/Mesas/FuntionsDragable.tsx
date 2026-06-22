import interact from "interactjs"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { string } from "yup/lib/locale"
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching"
import { Event, guests, planSpace, table } from "../../utils/Interfaces"

const addClass = (element: any, className: any) => {
  if (element.classList) {
    return element.classList.add(className)
  } else {
    element.className += ' ' + className
  }
}

const removeClass = (element: any, className: any) => {
  if (element.classList) {
    return element.classList.remove(className)
  } else {
    element.className = element.className.replace(new RegExp(className + ' *', 'g'), '')
  }
}
interface propsDropzone {
  target: string
  accept: string
  setEvent: Dispatch<SetStateAction<Event>>
  event: Event
  planSpaceActive: planSpace
  setPlanSpaceActive?: Dispatch<SetStateAction<planSpace>>
  handleOnDrop?: any
  filterGuests?: any
  isAllowed?: any
  ht?: any
  planSpaceSelect: string
}
export const setupDropzone = ({ target, accept, handleOnDrop, setEvent, event: eventAsd, planSpaceActive, setPlanSpaceActive, filterGuests, isAllowed, ht, planSpaceSelect }: propsDropzone) => {
  if (target == ".js-dropTables") {
    let values: any = {}
    interact(target)
      .dropzone({
        accept: accept,
        ondropactivate: function (event) {
        },
        ondropdeactivate: function (event) {
        },
        checker: function (
          dragEvent,         // related dragmove or dragend
          event,             // Touch, Pointer or Mouse Event
          dropped,           // bool default checker result
          dropzone,          // dropzone Interactable
          dropzoneElement,   // dropzone element
          draggable,         // draggable Interactable
          draggableElement,   // draggable element
        ) {
          // only allow drops into empty dropzone elements
          if (event.type == "pointerup") {
            if (dropped) {
              const { layerX, layerY, offsetX, offsetY, pageX, pageY } = event
              values = { layerX, layerY, offsetX, offsetY, pageX, pageY }
            }
          }
          return dropped && dropzoneElement.hasChildNodes();
        },
      })
      //cuando se ACTIVA la zona drogleable
      .on('dropactivate', (event) => {
      })
      //cuando se DESACTIVA la zona drogleable
      .on('dropdeactivate', (event) => {
      })
      //cuando ENTRA a una zona drogleable
      .on('dragenter', (event) => {
      })
      //cuando SALE de una zona drogleable sin haber soltado
      .on('dragleave', (event) => {
      })
      //cuando SUELTA sobre una zona drogleable
      .on('drop', (event) => {
        if (event.currentTarget.id === "lienzo-drop") {
          const asd = event.relatedTarget.id.replace(/dragN/, "").split("_")
          values = { ...values, modelo: asd[0], tipo: asd[1] }
          if (values?.layerX) {
            handleOnDrop(values)
          }
        }

      })
  }



  if (target == ".js-dropGuests") {

    interact(target)
      .dropzone({
        accept: accept,
        checker: function (
          dragEvent,         // related dragmove or dragend
          event,             // Touch, Pointer or Mouse Event
          dropped,           // bool default checker result
          dropzone,          // dropzone Interactable
          dropzoneElement,   // dropzone element
          draggable,         // draggable Interactable
          draggableElement   // draggable element
        ) {
          if (event.type == "pointerup") {
            if (dropped) {
              const invitadoID = draggableElement.id.slice(5, draggableElement.id.length)
              const prefijo = draggableElement.id.slice(0, 5)
              const tableID = dropzoneElement.id.split('-@-')[0]
              const chair = parseInt(dropzoneElement.id.split('-@-')[1])
              !isAllowed() ? ht() : moveGuest({ event: eventAsd, chair, invitadoID, tableID, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, prefijo, planSpaceSelect })
            }
          }
          return dropped && dropzoneElement.hasChildNodes();
        },
      })
      //cuando se ACTIVA la zona drogleable
      .on('dropactivate', (event) => {
        const active = event.target.getAttribute('active') | 0
        // change style if it was previously not active
        if (active === 0) {
          addClass(event.target, '-drop-possible')
        }

        event.target.setAttribute('active', active + 1)
      })
      //cuando se DESACTIVA la zona drogleable
      .on('dropdeactivate', (event) => {
        const active = event.target.getAttribute('active') | 0
        if (active === 1) {
          removeClass(event.target, '-drop-possible')
        }
        event.target.setAttribute('active', active - 1)
      })
      //cuando esta SOBRE una zona drogleable
      .on('dragenter', (event) => {
        if (event.target.id != "listInvitados") {
          addClass(event.target, 'bg-secondary')
        }
        if (event.target.id == "listInvitados" && event.relatedTarget.id.slice(0, 5) == "dragN") {
        } else {
          let element = document.getElementById(event.relatedTarget.id.replace(/dragN/, "dragM"))
          if (element.id.slice(0, 5) == "dragS") { element = document.getElementById(event.relatedTarget.id.replace(/dragS/, "dragM")) }
          if (element) {
            removeClass(element, 'border-gray-600')
            removeClass(element, 'border-2')
            addClass(element, 'border-green')
            addClass(element, 'border-4')
          }
        }
        //event.relatedTarget.textContent = "I'm in"
      })
      //cuando SALE de una zona drogleable sin haber soltado
      .on('dragleave', (event) => {
        if (event.target.id != "listInvitados") {
          removeClass(event.target, 'bg-secondary')
        }
        if (event.target.id == "listInvitados" && event.relatedTarget.id.slice(0, 5) == "dragN") {
        } else {
          let element = document.getElementById(event.relatedTarget.id.replace(/dragN/, "dragM"))
          if (element.id.slice(0, 5) == "dragS") { element = document.getElementById(event.relatedTarget.id.replace(/dragS/, "dragM")) }
          if (element) {
            removeClass(element, 'border-green')
            removeClass(element, 'border-4')
            addClass(element, 'border-gray-600')
            addClass(element, 'border-2')
          }
        }
        //event.relatedTarget.textContent = 'Drag me…'
      })
      //cuando SUELTA sobre una zona drogleable
      .on('drop', (event) => {
        removeClass(event.target, 'bg-secondary')
        //event.relatedTarget.textContent = 'Dropped'
      })
  }
}

// Añadir invitado | Carga en BD y estado
type propsMoveInvitado = {
  invitadoID: string,
  chair: number,
  tableID: string,
  event: Event,
  setEvent: Dispatch<SetStateAction<Event>>
  planSpaceActive: planSpace
  setPlanSpaceActive: Dispatch<SetStateAction<planSpace>>
  filterGuests?: any
  prefijo?: string
  planSpaceSelect: string
}
export const moveGuest = async ({ invitadoID, chair, tableID, event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, prefijo, planSpaceSelect }: propsMoveInvitado): Promise<void> => {
  try {
    const eventID = event?._id
    const table: table = planSpaceActive?.tables?.find(elem => elem._id === tableID)
    const idx = table?.guests?.findIndex(elem => elem.chair === chair)
    if (idx < 0 || idx === undefined) {
      if (chair >= 0) {
        const newGuest = { _id: invitadoID, chair, order: new Date() }
        const newGuests = [...(table.guests ?? []), newGuest]
        // Update inmutable de planSpaceActive y event.planSpace.
        const newPlanSpaceActive = {
          ...planSpaceActive,
          tables: planSpaceActive.tables.map(tb =>
            tb._id !== tableID ? tb : { ...tb, guests: newGuests }
          ),
        }
        setPlanSpaceActive(newPlanSpaceActive)
        setEvent((prev) => ({
          ...prev,
          planSpace: prev.planSpace.map(ps =>
            ps._id !== planSpaceSelect ? ps : newPlanSpaceActive
          ),
        }))
        fetchApiEventos({
          query: queries.editTable,
          variables: {
            eventID,
            planSpaceID: planSpaceActive?._id,
            tableID: table?._id,
            variable: "guests",
            valor: JSON.stringify(newGuests)
          },
        });
        // Sync guest record: update nombre_mesa and puesto (api-mcp via fetchApiBodas)
        fetchApiBodas({
          query: queries.editGuests,
          variables: { eventID, guestID: invitadoID, datos: { nombre_mesa: table?.title || tableID } },
        });
        fetchApiBodas({
          query: queries.editGuests,
          variables: { eventID, guestID: invitadoID, datos: { puesto: String(chair) } },
        });
      }
      if (prefijo === "dragS") {
        const gestPrevMove = filterGuests.sentados.find(elem => elem._id === invitadoID)
        const f1 = planSpaceActive.tables.findIndex(elem => elem._id === gestPrevMove.tableID)
        const newGuestsAfterRemove = planSpaceActive.tables[f1].guests.filter(g => g._id !== invitadoID)
        // Update inmutable: remover invitado de mesa previa.
        const newPlanSpaceActive2 = {
          ...planSpaceActive,
          tables: planSpaceActive.tables.map((tb, i) =>
            i !== f1 ? tb : { ...tb, guests: newGuestsAfterRemove }
          ),
        }
        fetchApiEventos({
          query: queries.editTable,
          variables: {
            eventID,
            planSpaceID: planSpaceActive?._id,
            tableID: planSpaceActive.tables[f1]._id,
            variable: "guests",
            valor: JSON.stringify(newGuestsAfterRemove)
          },
        });
        setPlanSpaceActive(newPlanSpaceActive2)
        setEvent((prev) => ({
          ...prev,
          planSpace: prev.planSpace.map(ps =>
            ps._id !== planSpaceSelect ? ps : newPlanSpaceActive2
          ),
        }))
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Guardar en BD y estado nueva posicion de la mesa
interface PropsActualizarPosicion {
  x: number;
  y: number;
  targetID: string;
  event: Event;
  setEvent: any;
  planSpaceActive: planSpace
  setPlanSpaceActive: any
}
export const ActualizarPosicion = async ({ x, y, targetID, event, setEvent, planSpaceActive, setPlanSpaceActive }):
  Promise<void> => {
  try {
    const asd = targetID.split("_")
    const target = asd[0]
    const ID = asd[1]
    if (target === "table") {
      // BUG-M-02 (informe QA 22-jun): drag movía visualmente pero el backend
      // no persistía. Capturamos la respuesta del API para detectar el problema
      // (success/errors) en vez de fire-and-forget.
      fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          tableID: ID,
          variable: "position",
          valor: JSON.stringify({ x, y })
        },
      }).then((r: any) => {
        if (r && r.success === false) {
          console.warn('[ActualizarPosicion] backend rechazó la mutación de position:', r.errors)
        }
      }).catch((e) => {
        console.warn('[ActualizarPosicion] editTable position falló:', e?.message ?? e)
      });
      // Update inmutable de la posición de la mesa.
      const newPlanSpaceActive = {
        ...planSpaceActive,
        tables: planSpaceActive.tables.map(tb =>
          tb._id !== ID ? tb : { ...tb, position: { x, y } }
        ),
      }
      setPlanSpaceActive(newPlanSpaceActive)
      setEvent((prev) => ({
        ...prev,
        planSpace: prev.planSpace.map(ps =>
          ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
        ),
      }))
    }
    if (target === "element") {
      fetchApiBodas({
        query: queries.editElement,
        variables: {
          evento_id: event._id,
          element_id: ID,
          datos: { position: { x, y } }
        },
      });
      // Update inmutable de la posición del elemento.
      const newPlanSpaceActive = {
        ...planSpaceActive,
        elements: planSpaceActive.elements.map(el =>
          el._id !== ID ? el : { ...el, position: { x, y } }
        ),
      }
      setPlanSpaceActive(newPlanSpaceActive)
      setEvent((prev) => ({
        ...prev,
        planSpace: prev.planSpace.map(ps =>
          ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
        ),
      }))
    }
  } catch (error) {
    console.error(error);
  }
};

// Guardar en BD y estado nuevo tamaño del elemento/mesa
interface PropsActualizarSize {
  width: number;
  height: number;
  targetID: string;
  event: Event;
  setEvent: any;
  planSpaceActive: planSpace;
  setPlanSpaceActive: any;
}

export const ActualizarSize = async ({ width, height, targetID, event, setEvent, planSpaceActive, setPlanSpaceActive }: PropsActualizarSize): Promise<void> => {
  try {
    const [target, ID] = targetID.split("_");
    if (target === "table") {
      await fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          tableID: ID,
          variable: "size",
          valor: JSON.stringify({ width, height })
        },
      });
      const exists = planSpaceActive?.tables.some((elem) => elem._id === ID);
      if (exists) {
        // Update inmutable del size de la mesa.
        const newPlanSpaceActive = {
          ...planSpaceActive,
          tables: planSpaceActive.tables.map(tb =>
            tb._id !== ID ? tb : { ...tb, size: { width, height } as any }
          ),
        }
        setPlanSpaceActive(newPlanSpaceActive);
        setEvent((prev) => ({
          ...prev,
          planSpace: prev.planSpace.map(ps =>
            ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
          ),
        }));
      }
    }
    if (target === "element") {
      await fetchApiBodas({
        query: queries.editElement,
        variables: {
          evento_id: event._id,
          element_id: ID,
          datos: { size: { width, height } }
        },
      });
      const exists = planSpaceActive?.elements.some((elem) => elem._id === ID);
      if (exists) {
        // Update inmutable del size del elemento.
        const newPlanSpaceActive = {
          ...planSpaceActive,
          elements: planSpaceActive.elements.map(el =>
            el._id !== ID ? el : { ...el, size: { width, height } as any }
          ),
        }
        setPlanSpaceActive(newPlanSpaceActive);
        setEvent((prev) => ({
          ...prev,
          planSpace: prev.planSpace.map(ps =>
            ps._id !== planSpaceActive._id ? ps : newPlanSpaceActive
          ),
        }));
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const useScreenSize = () => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  return { width, height };
};

export const handleScale = (valorX: any, valorY: any, lienzo: any): any => {

  const s = { x: 0, y: 0 }
  if (valorX > 767) {
    valorX = valorX / 12 * 9
    valorY = valorY - 144 - 32
  } else {
    valorX = valorX - 30
    valorY = valorY - 64 - 250 - 32 - 90
  }
  s.x = valorX * 100 / lienzo.ancho
  s.y = valorY * 100 / lienzo.alto
  if (s.x < s.y) {
    return s.x
  }
  return s.y
}