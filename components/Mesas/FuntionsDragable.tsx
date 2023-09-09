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

export const setupDropzone = (target: any, accept: any, setEvent: any, eventID: any) => {
  interact(target)
    .dropzone({
      accept: accept,
      ondropactivate: function (event) {
        //console.log(1001)
        //addClass(event.relatedTarget, '-drop-possible')

        //agrega texto al div
        //event.target.textContent = '1'
      },
      ondropdeactivate: function (event) {
        //console.log(1002)

        //removeClass(event.relatedTarget, '-drop-possible')
      },
      checker: function (
        dragEvent,         // related dragmove or dragend
        event,             // Touch, Pointer or Mouse Event
        dropped,           // bool default checker result
        dropzone,          // dropzone Interactable
        dropzoneElement,   // dropzone element
        draggable,         // draggable Interactable
        draggableElement   // draggable element
      ) {

        // only allow drops into empty dropzone elements
        //console.log("dragEvent:", dragEvent)
        //console.log("event:", event.button, event.buttons, event.type)
        if (event.type == "pointerup") {
          if (dropped) {
            const invitadoID = draggableElement.id.slice(5, draggableElement.id.length)
            const nMesaPrev = dropzoneElement.id.split('-@-')[0]
            const nombre_mesa = nMesaPrev != "listInvitados" ? nMesaPrev : "no asignado"
            const indexPrev = dropzoneElement.id.split('-@-')[1]
            const index: string | number = nMesaPrev != "listInvitados" ? indexPrev : "no asignado"
            MoveInvitado({ eventID: eventID, index: index, invitadoID: invitadoID, nombre_mesa: nombre_mesa, setEvent: setEvent })
            // console.log("--------------------------------------")
            // console.log("draggableElement:", draggableElement.id, invitadoID)
            // console.log("dropped:", dropped)
            // console.log("dropzone:", dropzone.target)
            // console.log("dropzoneElement:", dropzoneElement.id, "mesa:", nombre_mesa, "index:", index)
            // console.log("--------------------------------------")
          }
        }
        //console.log("dropzoneElement:", dropzoneElement)
        //console.log("draggable:", draggable)
        //console.log("draggableElement:", draggableElement)
        //console.log("--------------------------------------")
        return dropped && dropzoneElement.hasChildNodes();
      },
    })
    //cuando se ACTIVA la zona drogleable
    .on('dropactivate', (event) => {
      //console.log("dropactivate")
      const active = event.target.getAttribute('active') | 0

      // change style if it was previously not active
      if (active === 0) {
        addClass(event.target, '-drop-possible')
        //addClass(event.target, '-drop-possibleHover')
        //event.target.textContent = 'Drop me here!'
      }

      event.target.setAttribute('active', active + 1)
    })
    //cuando se DESACTIVA la zona drogleable
    .on('dropdeactivate', (event) => {
      const active = event.target.getAttribute('active') | 0
      // change style if it was previously active
      // but will no longer be active
      if (active === 1) {
        //remueve texto del div
        //event.target.removeChild(event.target.childNodes[0])

        removeClass(event.target, '-drop-possible')
        //removeClass(event.target, '-drop-possibleHover')
        //event.target.textContent = 'Dropzone'
        //event.target.appendChild(document.getElementById("cuadro"))
      }

      event.target.setAttribute('active', active - 1)
    })
    //cuando esta SOBRE una zona drogleable
    .on('dragenter', (event) => {
      console.log("sobre", event.target.id, " elemen: ", event.relatedTarget.id.slice(0, 5))

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
      //console.log("sale")
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

// Añadir invitado | Carga en BD y estado
type propsMoveInvitado = {
  invitadoID: string,
  index: string | number,
  nombre_mesa: string,
  eventID: string,
  setEvent: Dispatch<SetStateAction<Event>>
}
const MoveInvitado = async ({ invitadoID, index, nombre_mesa, eventID, setEvent }: propsMoveInvitado): Promise<void> => {
  try {
    if (index) {
      fetchApiEventos({
        query: queries.editGuests,
        variables: {
          eventID: eventID,
          guestID: invitadoID,
          variable: "puesto",
          value: index?.toString()
        }
      })
    }

    if (nombre_mesa) {
      fetchApiEventos({
        query: queries.editGuests,
        variables: {
          eventID: eventID,
          guestID: invitadoID,
          variable: "nombre_mesa",
          value: nombre_mesa
        }
      })
    }

    //console.log(123, invitadoID, index)
    //Añadir al array de la mesa
    setEvent(old => {
      const modifiedGuests: guests[] = old.invitados_array.map(item => {
        if (item._id === invitadoID) {
          return { ...item, puesto: index, nombre_mesa: nombre_mesa }
        }
        return item
      })
      const resp = { ...old, invitados_array: modifiedGuests }
      return resp
    })
  } catch (error) {
    console.log(error);
  }
}

// Guardar en BD y estado nueva posicion de la mesa
type PropsActualizarPosicion = {
  x: number;
  y: number;
  tableID: string;
  event: Event;
  setEvent: any;
  planSpaceActive: planSpace
  setPlanSpaceActive: any
}
export const ActualizarPosicion = async ({ x, y, tableID, event, setEvent, planSpaceActive, setPlanSpaceActive }: PropsActualizarPosicion): Promise<void> => {
  try {
    console.log(tableID)
    fetchApiEventos({
      query: queries.editTable,
      variables: {
        eventID: event._id,
        planSpaceID: planSpaceActive._id,
        tableID: tableID,
        variable: "position",
        valor: JSON.stringify({ x, y })
      },
    });

    //const nuevoArr = [...planSpaceActive?.tables];
    const index: number = planSpaceActive?.tables.findIndex((elem) => elem._id === tableID)
    planSpaceActive.tables[index].position = { x, y }
    event.planSpace[event.planSpaceSelect] = planSpaceActive
    setPlanSpaceActive({ ...planSpaceActive })
    setEvent({ ...event })

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