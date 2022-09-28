import interact from "interactjs"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { Event, guests } from "../../utils/Interfaces"

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

export const setupDropzone = (target: any, accept: any) => {
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
            console.log("dropped:", dropped)
            console.log("dropzone:", dropzone.target)
            console.log("dropzoneElement:", dropzoneElement.id)
            console.log("--------------------------------------")
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
      console.log("sobre")
      addClass(event.target, '-drop-over')
      //event.relatedTarget.textContent = "I'm in"
    })
    //cuando SALE de una zona drogleable sin haber soltado
    .on('dragleave', (event) => {
      console.log("sale")
      removeClass(event.target, '-drop-over')
      //event.relatedTarget.textContent = 'Drag me…'
    })
    //cuando SUELTA sobre una zona drogleable
    .on('drop', (event) => {
      removeClass(event.target, '-drop-over')
      //event.relatedTarget.textContent = 'Dropped'
    })
}

// Añadir invitado | Carga en BD y estado
export const AddInvitado = async (item: { tipo: string, invitado: guests, index: number, nombre_mesa: string }, event: Event, set: Dispatch<SetStateAction<Event>>): Promise<void> => {
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

// Guardar en BD y estado nueva posicion de la mesa
type PropsActualizarPosicion = {
  x: number;
  y: number;
  mesaID: string;
  event: Event;
  setEvent: any;
}
export const ActualizarPosicion = async ({ x, y, mesaID, event, setEvent }: PropsActualizarPosicion): Promise<void> => {
  try {
    fetchApiEventos({
      query: queries.editTable,
      variables: {
        eventID: event._id,
        tableID: mesaID,
        variable: "posicion",
        coordenadas: [{ x, y }],
      },
    });
    const nuevoArr = [...event?.mesas_array];
    const index = event?.mesas_array.findIndex((elem) => elem._id === mesaID)
    nuevoArr[index].posicion[0] = { x, y };
    setEvent((old) => ({
      ...old,
      mesas_array: nuevoArr,
    }));
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