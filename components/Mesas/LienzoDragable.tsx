import interact from 'interactjs'
import { FC, RefObject, useEffect, useRef, useState } from 'react'
import { AuthContextProvider, EventContextProvider } from '../../context'
import { ActualizarPosicion, setupDropzone, ActualizarSize } from './FuntionsDragable'
import { size, table, element } from '../../utils/Interfaces';
import { DragableDefault } from './DragableDefault';
import ClickAwayListener from 'react-click-away-listener';
import { useAllowed } from '../../hooks/useAllowed';

// Calculadora de posicion de sillas (Grados °) en mesa redonda
const DefinePosition: CallableFunction = (valor: number, mesa: { tipo: string | number }): number[] | number => {
  if (mesa.tipo == "redonda") {
    let arr = [];
    let deg = 0;
    while (deg <= 359) {
      deg = deg + valor;
      arr.push(deg);
    }

    return arr;
  }
  if (mesa.tipo == 1) {
    return 0;
  }
};

interface propsLienzoDragable {
  scale: number
  lienzo?: size
  setDisableWrapper: any
  disableDrag: boolean
  setShowFormEditar: boolean
}

export const LiezoDragable: FC<propsLienzoDragable> = ({ scale, lienzo, setDisableWrapper, disableDrag, setShowFormEditar }) => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests, editDefault, setEditDefault } = EventContextProvider();
  const [dragables, setDragables] = useState<any>([]);
  const [isAllowed, ht] = useAllowed()
  const { user } = AuthContextProvider()

  useEffect(() => {
    if (dragables?.length > 0) {
      setupDropzone({ target: '.js-dropGuests', accept: `${dragables}`, setEvent, event, planSpaceActive, setPlanSpaceActive, filterGuests, isAllowed, ht, user })
    }
  }, [dragables, filterGuests])

  useEffect(() => {
    const tablesDrag = planSpaceActive?.tables?.reduce((acc, item) => {
      acc[`table_${item._id}`] = { x: item.position.x, y: item.position.y }
      return acc
    }, {})
    const elementsDrag = planSpaceActive?.elements?.reduce((acc, item) => {
      acc[`element_${item._id}`] = { x: item.position.x, y: item.position.y }
      return acc
    }, {})

    const dragablesNoSentados = filterGuests?.noSentados?.map(elem => `#dragN${elem?._id}`) ?? []
    const positionsNoSentados = filterGuests?.noSentados?.reduce((acc, elem) => {
      return { ...acc, [`dragN${elem?._id}`]: { x: 0, y: 0 } }
    }, {})
    const dragablesSentados = filterGuests?.sentados?.map(elem => `#dragS${elem?._id}`) ?? []
    const positionsSentados = filterGuests?.sentados?.reduce((acc, elem) => {
      return { ...acc, [`dragS${elem?._id}`]: { x: 0, y: 0 } }
    }, {})

    setDragables([...dragablesNoSentados, ...dragablesSentados])
  }, [filterGuests])

  let sizeElement = { w: 0, h: 0 }
  let lienzoLimit = { x: 0, y: 0 }
  interact.maxInteractions(Infinity)
  let position: position = { x: 0, y: 0 }

  interact('.js-dragDefault').draggable({
    manualStart: false,
    listeners: {
      start(e) {
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          position.x = parseInt(element.getAttribute("data-x"), 10) || 0
          position.y = parseInt(element.getAttribute("data-y"), 10) || 0
        }
      },
      move(e) {
        position.x = position.x + e.dx
        position.y = position.y + e.dy
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          element.style.left = position.x + 'px'
          element.style.top = position.y + 'px'
          element.setAttribute('data-x', `${position.x}`)
          element.setAttribute('data-y', `${position.y}`)
        }
      },
      end(e) {
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          const rootElement = document.getElementById('areaDrag');
          rootElement?.removeChild(document.getElementById(e.target.id.replace(/dragN/, "dragM")))
        }
      },
    },
  })

  interact('.js-dragInvitadoN').draggable({
    manualStart: false,
    listeners: {
      start(e) {
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          position.x = parseInt(element.getAttribute("data-x"), 10) || 0
          position.y = parseInt(element.getAttribute("data-y"), 10) || 0
        }
      },
      move(e) {
        position.x = position.x + e.dx
        position.y = position.y + e.dy
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          element.style.left = position.x + 'px'
          element.style.top = position.y + 'px'
          element.setAttribute('data-x', `${position.x}`)
          element.setAttribute('data-y', `${position.y}`)
        }
      },
      end(e) {
        const element = document.getElementById(e.target.id.replace(/dragN/, "dragM"))
        if (element) {
          const rootElement = document.getElementById('areaDrag');
          rootElement?.removeChild(document.getElementById(e.target.id.replace(/dragN/, "dragM")))
        }
      },
    },
  })

  interact('.js-dragInvitadoS').draggable({
    manualStart: false,
    listeners: {
      start(e) {
        const element = document.getElementById(e.target.id.replace(/dragS/, "dragM"))
        if (element) {
          position.x = parseInt(element.getAttribute("data-x"), 10) || 0
          position.y = parseInt(element.getAttribute("data-y"), 10) || 0
        }
      },
      move(e) {
        position.x = position.x + e.dx
        position.y = position.y + e.dy
        const element = document.getElementById(e.target.id.replace(/dragS/, "dragM"))
        if (element) {
          element.style.left = position.x + 'px'
          element.style.top = position.y + 'px'
          element.setAttribute('data-x', `${position.x}`)
          element.setAttribute('data-y', `${position.y}`)
        }
      },
      end(e) {
        setDisableWrapper(false)
        const element = document.getElementById(e.target.id.replace(/dragS/, "dragM"))
        if (element) {
          const rootElement = document.getElementById('areaDrag');
          rootElement?.removeChild(document.getElementById(e.target.id.replace(/dragS/, "dragM")))
        }
      },
    },
  })
  interface position {
    x: number
    y: number
  }
  let i: position = {
    x: 1,
    y: 1
  }
  let valirStart = false
  let valirMove = false
  // setup draggable elements.
  const optionsDrag = {
    ignoreFrom: '.ign',
    manualStart: false,
    listeners: {
      start(e) {

        sizeElement = { w: e.rect.width / scale, h: e.rect.height / scale }
        sizeElement = { ...sizeElement }
        lienzoLimit = { x: lienzo.width - sizeElement.w, y: lienzo.height - sizeElement.h }
        lienzoLimit = { ...lienzoLimit }
        i.x = parseInt(e.target.getAttribute('data-x'), 10) || 0
        i.y = parseInt(e.target.getAttribute('data-y'), 10) || 0
        i = { ...i }
        valirStart = true
      },
      move(e) {
        if (!valirMove) {
          if (!valirStart) {
            i.x = parseInt(e.target.getAttribute('data-x'), 10) || 0
            i.y = parseInt(e.target.getAttribute('data-y'), 10) || 0
            i = { ...i }
          }
          valirMove = true
        }
        if (!!i?.x && !!i?.y && valirStart) {
          i.x = i.x + (e?.dx / scale)
          i.y = i.y + (e?.dy / scale)
          i = { ...i }
          if (i.x < 4) { i.x = 4 }
          if (i.y < 4) { i.y = 4 }
          if (i.x >= lienzoLimit.x - 4) { i.x = lienzoLimit.x - 4 }
          if (i.y >= lienzoLimit.y - 4) { i.y = lienzoLimit.y - 4 }
          e.target.style.left = i.x + 'px'
          e.target.style.top = i.y + 'px'
        }
      },
      end(e) {
        if (!!i?.x && !!i?.y && valirStart && valirMove) {
          e.target.setAttribute('data-x', i.x)
          e.target.setAttribute('data-y', i.y)
          ActualizarPosicion({ x: Math.trunc(i.x), y: Math.trunc(i.y), event: event, targetID: e.target.getAttribute('id'), setEvent: setEvent, planSpaceActive, setPlanSpaceActive })
        } else {
          console.log("////////////////////////////////////////////////////////////////////////fallo")
        }
      },
    },
  }
  interact('.js-drag')
    .draggable(optionsDrag)

  function getMarginResize(x: number) {
    const resultado = 1.5464 * x + 0.7216;
    return Math.round(resultado);
  }

  interact('.js-dragElement')
    .draggable(optionsDrag)
    .resizable({
      inertia: {
        resistance: 30,
        minSpeed: 200,
        endSpeed: 100
      },
      margin: getMarginResize(scale),
      listeners: {
        move: (e) => {
          //propiedades a manipular de divElement
          // data-x data-y obtenidas del dataset
          // propiedades a manipular de svgElement
          // width height obtenidas del dataset

          // Mantener posición acumulada en el dataset del contenedor
          const divElement = e.currentTarget as HTMLElement;
          const relativeElement = divElement.firstElementChild as HTMLElement | null;
          const svgElement = (relativeElement?.firstElementChild || undefined) as HTMLElement | undefined;
          let x = parseFloat(divElement.dataset.x || '0');
          let y = parseFloat(divElement.dataset.y || '0');
          // Aplicar deltas compensando el scale
          x = x + (e.deltaRect.left / scale);
          y = y + (e.deltaRect.top / scale);
          const newWidth = e.rect.width / scale;
          const newHeight = e.rect.height / scale;
          // Actualizar estilos visibles
          Object.assign(divElement.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
          Object.assign(svgElement.style, {
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          });
          // Sincronizar datasets para futuras interacciones de drag/resize
          divElement.dataset.x = String(x);
          divElement.dataset.y = String(y);
          if (svgElement) {
            svgElement.dataset.width = String(newWidth);
            svgElement.dataset.height = String(newHeight);
            // Si el SVG respeta width/height CSS, opcionalmente se puede reflejar:
            (svgElement as any).style && Object.assign((svgElement as any).style, { width: `${newWidth}px`, height: `${newHeight}px` });
          }
        },
        end: (e) => {
          //propiedades a manipular de divElement
          // data-x data-y obtenidas del dataset
          // propiedades a manipular de svgElement
          // width height obtenidas del dataset
          // Persistir en estado/BD al finalizar el resize
          const divElement = e.currentTarget as HTMLElement;
          const relativeElement = divElement.firstElementChild as HTMLElement | null;
          const svgElement = (relativeElement?.firstElementChild || undefined) as HTMLElement | undefined;
          const target = e.currentTarget as HTMLElement;
          const width = parseFloat(svgElement.style.width || '0');
          const height = parseFloat(svgElement.style.height || '0');
          const x = parseFloat(divElement.dataset.x || '0');
          const y = parseFloat(divElement.dataset.y || '0');
          // Guardar tamaño
          ActualizarSize({
            width: Math.max(0, Math.trunc(width)),
            height: Math.max(0, Math.trunc(height)),
            targetID: e.target.getAttribute('id'),
            event,
            setEvent,
            planSpaceActive,
            setPlanSpaceActive,
          } as any);
          // Guardar posición si cambió por los bordes top/left
          ActualizarPosicion({
            x: Math.trunc(x),
            y: Math.trunc(y),
            targetID: e.target.getAttribute('id'),
            event,
            setEvent,
            planSpaceActive,
            setPlanSpaceActive,
          } as any);
        },
      },
      edges: {
        top: true,
        left: true,
        bottom: true,
        right: true
      },
      // Width and height can be adjusted independently. When `true`, width and
      // height are adjusted at a 1:1 ratio.
      square: false,
      // Width and height can be adjusted independently. When `true`, width and
      // height maintain the aspect ratio they had when resizing started.
      preserveAspectRatio: false,
      // a value of 'none' will limit the resize rect to a minimum of 0x0
      // 'negate' will allow the rect to have negative width/height
      // 'reposition' will keep the width/height positive by swapping
      // the top and bottom edges and/or swapping the left and right edges
      //invert: 'none' || 'negate' || 'reposition'

      // limit multiple resizes.
      // See the explanation in the {@link Interactable.draggable} example
      max: Infinity,
      maxPerElement: 1,
    })

  interact('.resizable')
    .resizable({
      edges: { top: true, left: true, bottom: true, right: true },
      listeners: {
        move: function (event) {
          let { x, y } = event.target.dataset

          x = (parseFloat(x) / scale || 0) + event.deltaRect.left / scale
          y = (parseFloat(y) / scale || 0) + event.deltaRect.top / scale

          Object.assign(event.target.style, {
            width: `${event.rect.width / scale}px`,
            height: `${event.rect.height / scale}px`,
            transform: `translate(${x}px, ${y}px)`
          })

          Object.assign(event.target.dataset, { x, y })
        }
      }
    })
  const ref = useRef<RefObject<HTMLDivElement>>(null)

  return (
    <>
      {planSpaceActive?.tables?.map((item: table, idx) => {
        return (
          <ClickAwayListener
            key={idx}
            onClickAway={() => {
              if (item._id === editDefault?.clicked && editDefault.active) {
                setEditDefault({})
              }
            }}
            mouseEvent="mouseup"
            touchEvent="touchend">
            <DragableDefault ref={ref} item={item} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} prefijo='table' setShowFormEditar={setShowFormEditar} DefinePosition={DefinePosition} idx={idx} />
          </ClickAwayListener>

        );
      })}
      {planSpaceActive?.elements?.map((item: element, idx) => {
        return (
          <ClickAwayListener
            key={idx}
            onClickAway={() => {
              if (item._id === editDefault?.clicked && editDefault.active) {
                setEditDefault({})
              }
            }}
            mouseEvent="mouseup"
            touchEvent="touchend">
            <DragableDefault ref={ref} key={item._id} item={item} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} prefijo="element" setShowFormEditar={setShowFormEditar} />
          </ClickAwayListener>
        );
      })}
      <style>
        {`
          .dropzone-wrapper {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
          }
          .dropzone {
              overflow: hidden;
              margin: .5em;
              padding: 1em;
              color: #666;
              text-align: center;
              background: #ccc;
              line-height: 4em;
              border: 4px dashed transparent;
              transition: background .15s linear, border-color .15s linear;
          }
          .dropzone.-drop-possible { border-color: #666; }
          .dropzone.-drop-over {
              background: #666;
              color: #fff;
          }
          .draggable {
              height: 60px;
              z-index: 10;
              width: 90px;
              margin: .25em;
              padding: 1em 2em;
              background-color: #29e;
              color: #fff;
              text-align: center;
              left: 0px;
              top: 0px;
          }
          .draggable-touch {
              -ms-touch-action: none;
                  touch-action: none;
          }
          .draggable.-drop-possible { background-color: #42bd41; }
          .js-dropListInvitados.-drop-possibleHover:hover {
            background-color: orange;
          }
          .js-dragInvitadoN {
            touch-action: none;
            user-select: none;
          }
          .js-dragDefault {
            touch-action: none;
            user-select: none;
          }

          .resizable {
            width: 120px;
            border-radius: 0.75rem;
            padding: 20px;
            margin: 1rem;
            background-color: #29e;
            color: white;
            font-size: 20px;
            font-family: sans-serif;
            overflow: hidden;

            touch-action: none;

            /* This makes things *much* easier */
            box-sizing: border-box;
          }
          
        `}
      </style>
    </>
  )
}