import interact from 'interactjs'
import { FC, useEffect, useMemo, useState } from 'react'
import { Table } from '../components/Mesas/LayoutMesas'
import { EventContextProvider } from '../context'
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
  AddInvitado?: any
}


export const Dragable: FC<propsDragable> = ({ scale, lienzo, setDisableWrapper, AddInvitado }) => {
  const { event, setEvent } = EventContextProvider();
  const [disableLayout, setDisableLayout] = useState<boolean>(false);
  const [dragPositions, setDragPositions] = useState<any>();

  useEffect(() => {
    // setup drop areas.
    // dropzone #1 accepts draggable #1
    setupDropzone('#drop1', '#drag1')
    // dropzone #2 accepts draggable #1 and #2
    setupDropzone('#drop2', '#drag1, #drag2')
    // every dropzone accepts draggable #3
    setupDropzone('.js-drop', '#drag3')

  }, [])
  let transformProp: any
  useEffect(() => {
    const mesasDrag = event.mesas_array.reduce((acc, n) => {
      acc[n._id] = { x: n.posicion[0].x, y: n.posicion[0].y }
      return acc
    }, {})
    setDragPositions({ ...mesasDrag, drag1: { x: 200, y: 200 } })
  }, [event.mesas_array])

  let sizeElement = { w: 0, h: 0 }
  let lienzoLimit = { x: 0, y: 0 }
  interact.maxInteractions(Infinity)
  // setup draggable elements.
  interact('.js-drag').draggable({
    manualStart: false,
    listeners: {
      start(e) {
        sizeElement = { w: e.rect.width, h: e.rect.height }
        lienzoLimit = { x: Math.round(lienzo.ancho - sizeElement.w * 2), y: Math.round(lienzo.alto - sizeElement.h * 2) }
        console.log(lienzo)
        console.log(sizeElement)
        console.log(lienzoLimit)

        const position = dragPositions[e.target.id]
        position.x = parseInt(e.target.getAttribute('data-x'), 10) || 0
        position.y = parseInt(e.target.getAttribute('data-y'), 10) || 0
      },
      move(e) {
        const position = dragPositions[e.target.id]
        position.x >= 0 ? position.x += parseInt(e.dx != 0 ? e.dx / scale : e.dx, 10) || 0 : position.x = 0
        position.y >= 0 ? position.y += parseInt(e.dy != 0 ? e.dy / scale : e.dy, 10) || 0 : position.y = 0
        if (position.x >= lienzoLimit.x) { position.x = lienzoLimit.x }
        if (position.y >= lienzoLimit.y) { position.y = lienzoLimit.y }

        //console.log(position.x, position.y)
        if (transformProp) {
          console.log("move", 0)
          e.target.style[transformProp] = 'translate(' + position.x + 'px, ' + position.y + 'px)'
        } else {
          console.log("move", 1)
          e.target.style.left = position.x + 'px'
          e.target.style.top = position.y + 'px'
        }

      },
      end(e) {
        const position = dragPositions[e.target.id]
        console.log("end", position)
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
          <Table
            key={mesa._id}
            mesa={{ ...mesa, posicion: mesa.posicion[0] }}
            setDisableLayout={setDisableLayout}
            index={index}
            AddInvitado={AddInvitado}
            DefinePosition={DefinePosition}
            setDisableWrapper={setDisableWrapper}
            setEvent={setEvent}
          />
        );
      })}
      <div id="cuadro" className='bg-red w-4 h-4'></div>
      {/* <div id="drag1"
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="truncate absolute draggable draggable-touch js-drag">algo</div> */}
      {/* <div id="drag2"
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="truncate draggable js-drag">Drag2 me…</div>
      <div id="drag3"
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="truncate draggable js-drag">Drag3 me…</div>

      <div id="drag4"
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="truncate draggable js-drag">Drag4 me…</div> */}
      <div className="dropzone-wrapper w-[600px]">
        <div id="drop1" className="dropzone js-drop"></div>
        <div id="drop2" className="dropzone js-drop"></div>
        <div id="drop3" className="dropzone js-drop"></div>
      </div>

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
              height: 20px;
              z-index: 10;
              width: 20px;
              margin: .25em;
              padding: 1em 2em;
              background-color: #29e;
              color: #fff;
              text-align: center;
          }

          .draggable-touch {
              -ms-touch-action: none;
                  touch-action: none;
          }

          .draggable.-drop-possible { background-color: #42bd41; }
        `}
      </style>
    </>
  )
}