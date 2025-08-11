import interact from "interactjs"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { string } from "yup/lib/locale"
import { fetchApiEventos, queries } from "../../utils/Fetching"
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
          //console.log("ondropactivate", event.dropzone.target)
        },
        ondropdeactivate: function (event) {
          //console.log("ondropdeactivate", event.currentTarget)
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
        // // // console.log("cuando se ACTIVA la zona drogleable", event.target.id)
      })
      //cuando se DESACTIVA la zona drogleable
      .on('dropdeactivate', (event) => {
        // // // console.log("cuando se DESactiva la zona drogleable", event.target.id)
      })
      //cuando ENTRA a una zona drogleable
      .on('dragenter', (event) => {
        // // // console.log("cuando ENTRA a la zona drogleable", event.target.id)
      })
      //cuando SALE de una zona drogleable sin haber soltado
      .on('dragleave', (event) => {
        // // // console.log("cuando SALE de la zona drogleable", event.target.id)
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
    let table: table = planSpaceActive?.tables?.find(elem => elem._id === tableID)
    const idx = table?.guests?.findIndex(elem => elem.chair === chair)
    if (idx < 0 || idx === undefined) {
      if (chair >= 0) {
        table.guests.push({ _id: invitadoID, chair, order: new Date() })
        let f1 = planSpaceActive.tables.findIndex(elem => elem._id === tableID)
        //planSpaceActive.tables.splice(f1, 1, table)
        setPlanSpaceActive({ ...planSpaceActive })
        f1 = event.planSpace.findIndex(elem => elem._id === planSpaceSelect)
        event.planSpace[f1] = planSpaceActive
        setEvent({ ...event })
        fetchApiEventos({
          query: queries.editTable,
          variables: {
            eventID,
            planSpaceID: planSpaceActive?._id,
            tableID: table?._id,
            variable: "guests",
            valor: JSON.stringify([...table?.guests])
          },
        });
      }
      if (prefijo === "dragS") {
        const gestPrevMove = filterGuests.sentados.find(elem => elem._id === invitadoID)
        let f1 = planSpaceActive.tables.findIndex(elem => elem._id === gestPrevMove.tableID)
        const f2 = planSpaceActive.tables[f1].guests.findIndex(elem => elem._id === invitadoID)
        planSpaceActive.tables[f1].guests.splice(f2, 1)
        fetchApiEventos({
          query: queries.editTable,
          variables: {
            eventID,
            planSpaceID: planSpaceActive?._id,
            tableID: planSpaceActive.tables[f1]._id,
            variable: "guests",
            valor: JSON.stringify(planSpaceActive.tables[f1].guests)
          },
        });
        setPlanSpaceActive({ ...planSpaceActive })
        f1 = event.planSpace.findIndex(elem => elem._id === planSpaceSelect)
        event.planSpace[f1] = planSpaceActive
        setEvent({ ...event })
      }
    }
  } catch (error) {
    console.log(error);
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
      fetchApiEventos({
        query: queries.editTable,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          tableID: ID,
          variable: "position",
          valor: JSON.stringify({ x, y })
        },
      });
      const index: number = planSpaceActive?.tables.findIndex((elem) => elem._id === ID)
      planSpaceActive.tables[index].position = { x, y }
      setPlanSpaceActive({ ...planSpaceActive })
      setEvent({ ...event })
    }
    if (target === "element") {
      fetchApiEventos({
        query: queries.editElement,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          elementID: ID,
          variable: "position",
          valor: JSON.stringify({ x, y })
        },
      });
      const index: number = planSpaceActive?.elements.findIndex((elem) => elem._id === ID)
      planSpaceActive.elements[index].position = { x, y }
      setPlanSpaceActive({ ...planSpaceActive })
      setEvent({ ...event })
    }
  } catch (error) {
    console.log(error);
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
      const index: number = planSpaceActive?.tables.findIndex((elem) => elem._id === ID);
      if (index >= 0) {
        planSpaceActive.tables[index].size = { width, height } as any;
        setPlanSpaceActive({ ...planSpaceActive });
        setEvent({ ...event });
      }
    }
    if (target === "element") {
      await fetchApiEventos({
        query: queries.editElement,
        variables: {
          eventID: event._id,
          planSpaceID: planSpaceActive._id,
          elementID: ID,
          variable: "size",
          valor: JSON.stringify({ width, height })
        },
      });
      const index: number = planSpaceActive?.elements.findIndex((elem) => elem._id === ID);
      if (index >= 0) {
        planSpaceActive.elements[index].size = { width, height } as any;
        setPlanSpaceActive({ ...planSpaceActive });
        setEvent({ ...event });
      }
    }
  } catch (error) {
    console.log(error);
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