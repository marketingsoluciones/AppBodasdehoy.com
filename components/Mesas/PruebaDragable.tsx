import interact from 'interactjs'
import { FC, useEffect, useState } from 'react'
import { MesaContent } from './MesaContent';
import { EventContextProvider } from '../../context'
import { ActualizarPosicion, setupDropzone } from './FuntionsDragable'

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

interface propsDragable {
  scale?: any
  lienzo?: { ancho: any, alto: any }
  setDisableWrapper?: any
  disableDrag: any
}


export const Dragable: FC<propsDragable> = ({ scale, lienzo, setDisableWrapper, disableDrag }) => {
  const { event, setEvent } = EventContextProvider();
  const [disableLayout, setDisableLayout] = useState<boolean>(false);
  const [dragPositions, setDragPositions] = useState<any>();
  const [dragables, setDragables] = useState<any>([]);

  useEffect(() => {
    // setup drop areas.
    // dropzone #1 accepts draggable #1
    // // // setupDropzone('#drop1', `#drag1, #pdrag1 `)
    // dropzone #2 accepts draggable #1 and #2
    // // // setupDropzone('#drop2', '#drag0, #drag1, #pdrag1')
    // every dropzone accepts draggable #3
    setupDropzone('.js-drop', `${dragables}, #pdragInvitado1, #invitadoPrueba`, setEvent, event._id)

  }, [dragables])
  let transformProp: any
  useEffect(() => {
    const filterGuestsDraggable = (event?.invitados_array?.reduce((acc, guest) => {
      if (event?.mesas_array?.map(table => table.nombre_mesa).includes(guest.nombre_mesa)) {
        acc.dragables.push(`#dragS${guest._id}`)
        acc.sentados[`dragS${guest._id}`] = { x: 0, y: 0 }
      } else {
        acc.dragables.push(`#dragN${guest._id}`)
        acc.noSentados[`dragN${guest._id}`] = { x: 0, y: 0 }
      }
      return acc
    }, { sentados: {}, noSentados: [], dragables: [] }))
    //console.log(filterGuestsDraggable)
    const mesasDrag = event.mesas_array.reduce((acc, n) => {
      acc[n._id] = { x: n.posicion[0].x, y: n.posicion[0].y }
      return acc
    }, {})
    //console.log(mesasDrag)
    setDragables(filterGuestsDraggable.dragables)
    setDragPositions({
      ...mesasDrag,
      ...filterGuestsDraggable.sentados,
      ...filterGuestsDraggable.noSentados,
      pdrag1: { x: 0, y: 0 },
      pdragInvitado1: { x: 0, y: 0 },
    })
  }, [event.mesas_array, event])

  let sizeElement = { w: 0, h: 0 }
  let lienzoLimit = { x: 0, y: 0 }
  interact.maxInteractions(Infinity)
  let position = { x: 0, y: 0 }

  interact('.js-dragInvitadoN').draggable({
    manualStart: false,
    listeners: {
      start(e) {
        console.log("js-dragInvitadoN")
        console.log("start", e.target.id)
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
        console.log("end js-dragInvitadoN")
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
        console.log("js-dragInvitadoN")
        console.log("start", e.target.id)
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
        console.log("end js-dragInvitadoS")
        setDisableWrapper(false)
        const element = document.getElementById(e.target.id.replace(/dragS/, "dragM"))
        if (element) {
          const rootElement = document.getElementById('areaDrag');
          rootElement?.removeChild(document.getElementById(e.target.id.replace(/dragS/, "dragM")))
        }
      },
    },
  })

  // setup draggable elements.
  interact('.js-drag').draggable({
    ignoreFrom: '.ign',
    manualStart: false,
    listeners: {
      start(e) {
        console.log("js-drag")
        let position = { x: 0, y: 0 }
        position = dragPositions[e.target.id]
        sizeElement = { w: e.rect.width, h: e.rect.height }
        lienzoLimit = { x: Math.round(lienzo.ancho - sizeElement.w * 2), y: Math.round(lienzo.alto - sizeElement.h * 2) }
        position.x = parseInt(e.target.getAttribute('data-x'), 10) || 0
        position.y = parseInt(e.target.getAttribute('data-y'), 10) || 0
      },
      move(e) {
        let position = { x: 0, y: 0 }
        position = dragPositions[e.target.id]
        position.x >= 0 ? position.x += parseInt(e.dx != 0 ? e.dx / scale : e.dx, 10) || 0 : position.x = 0
        position.y >= 0 ? position.y += parseInt(e.dy != 0 ? e.dy / scale : e.dy, 10) || 0 : position.y = 0
        if (position.x >= lienzoLimit.x) { position.x = lienzoLimit.x }
        if (position.y >= lienzoLimit.y) { position.y = lienzoLimit.y }
        if (transformProp) {
          console.log("moveN", 0)
          e.target.style[transformProp] = 'translate(' + position.x + 'px, ' + position.y + 'px)'
        } else {
          e.target.style.left = position.x + 'px'
          e.target.style.top = position.y + 'px'
        }

      },
      end(e) {
        const position = dragPositions[e.target.id]
        console.log("end js-drag")
        ActualizarPosicion({ x: position.x, y: position.y, event: event, mesaID: e.target.getAttribute('id'), setEvent: setEvent })
        e.target.style[transformProp] = 'translate(' + position.x + 'px, ' + position.y + 'px)'
        e.target.style.left = position.x + 'px'
        e.target.style.top = position.y + 'px'
        e.target.setAttribute('data-x', position.x)
        e.target.setAttribute('data-y', position.y)
      },
    },
  })

  /* eslint-disable multiline-ternary */
  interact(document).on('ready', () => {
    transformProp =
      'transform' in document.body.style
        ? 'transform'
        : 'webkitTransform' in document.body.style
          ? 'webkitTransform'
          : 'mozTransform' in document.body.style
            ? 'mozTransform'
            : 'oTransform' in document.body.style
              ? 'oTransform'
              : 'msTransform' in document.body.style
                ? 'msTransform'
                : null
  })
  /* eslint-enable multiline-ternary */

  return (
    <>
      {event?.mesas_array?.map((mesa, index) => {
        return (
          <MesaContent
            key={mesa._id}
            mesa={{ ...mesa, posicion: mesa.posicion[0] }}
            DefinePosition={DefinePosition}
            setDisableWrapper={setDisableWrapper}
            disableDrag={disableDrag}
          />
        );
      })}
      {/* <div id="cuadro" className='bg-red w-4 h-4'></div>
      <div id="pdrag1"
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="truncate absolute draggable draggable-touch js-drag">
        <div className='ign bg-red w-[30px] h-[30px]'>
          <div id="pdragInvitado1" className='js-dragInvitadoS absolute bg-white w-[10px] h-[10px]'>
            x
          </div>
        </div>
        algo
      </div> */}
      {/* <div className="dropzone-wrapper w-[5px]">
        <div id="drop1" className="dropzone h-[5px] "></div>
        <div id="drop2" className="dropzone h-[5px] js-drop"></div>
        <div id="drop3" className="dropzone h-[5px] js-drop"></div>
      </div> */}

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
        `}
      </style>
    </>
  )
}