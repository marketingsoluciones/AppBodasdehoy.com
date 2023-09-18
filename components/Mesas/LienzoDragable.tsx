import interact from 'interactjs'
import { FC, useEffect, useState } from 'react'
import { MesaContent } from './MesaContent';
import { EventContextProvider } from '../../context'
import { ActualizarPosicion, setupDropzone } from './FuntionsDragable'
import { size, table, element } from '../../utils/Interfaces';
import { ListTables } from './BlockPanelMesas';
import { DragableDefault } from './DragableDefault';
import { ElementContent } from './ElementContent';

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
  scale?: number
  lienzo?: size
  setDisableWrapper: any
  disableDrag: boolean
  setShowFormEditar: boolean
}

export const LiezoDragable: FC<propsLienzoDragable> = ({ scale, lienzo, setDisableWrapper, disableDrag, setShowFormEditar }) => {
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, filterGuests } = EventContextProvider();
  const [disableLayout, setDisableLayout] = useState<boolean>(false);
  const [dragPositions, setDragPositions] = useState<any>();
  const [dragables, setDragables] = useState<any>([]);

  useEffect(() => {
    if (dragables?.length > 0) {
      setupDropzone({ target: '.js-dropGuests', accept: `${dragables}`, setEvent, eventID: event?._id, planSpaceActive, setPlanSpaceActive, filterGuests })
    }
  }, [dragables, filterGuests])

  let transformProp: any

  useEffect(() => {
    const tablesDrag = planSpaceActive?.tables?.reduce((acc, item) => {
      acc[`table_${item._id}`] = { x: item.position.x, y: item.position.y }
      return acc
    }, {})
    const elementsDrag = planSpaceActive?.elements?.reduce((acc, item) => {
      acc[`element_${item._id}`] = { x: item.position.x, y: item.position.y }
      return acc
    }, {})

    const dragablesNoSentados = filterGuests.noSentados.map(elem => `#dragN${elem?._id}`)
    const positionsNoSentados = filterGuests.noSentados.reduce((acc, elem) => {
      return { ...acc, [`dragN${elem?._id}`]: { x: 0, y: 0 } }
    }, {})
    const dragablesSentados = filterGuests.sentados.map(elem => `#dragS${elem?._id}`)
    const positionsSentados = filterGuests.sentados.reduce((acc, elem) => {
      return { ...acc, [`dragS${elem?._id}`]: { x: 0, y: 0 } }
    }, {})

    setDragables([...dragablesNoSentados, ...dragablesSentados])
    setDragPositions({
      ...tablesDrag,
      ...elementsDrag,
      ...positionsSentados,
      ...positionsNoSentados,
      pdrag1: { x: 0, y: 0 },
    })
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
        //  console.log(e)
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
        console.log(e)
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
  let i: position
  // setup draggable elements.
  interact('.js-drag').draggable({
    ignoreFrom: '.ign',
    manualStart: false,
    listeners: {
      start(e) {
        position = dragPositions[e.target.id]
        i = { ...position }
        sizeElement = { w: e.rect.width, h: e.rect.height }
        lienzoLimit = { x: Math.round(lienzo.width - sizeElement.w * 2), y: Math.round(lienzo.height - sizeElement.h * 2) }
        i.x = parseInt(e.target.getAttribute('data-x'), 10) || 0
        i.y = parseInt(e.target.getAttribute('data-y'), 10) || 0

      },
      move(e) {
        i.x = i.x + e?.dx / (Math.round(scale * 100) / 100)
        i.y = i.y + e?.dy / (Math.round(scale * 100) / 100)
        e.target.style.left = i.x + 'px'
        e.target.style.top = i.y + 'px'
        // console.log(523, parseInt(e.dy != 0 ? e.dy / (Math.round(scale * 100) / 100) : e.dy, 10))
        // position.x >= 0 ? position.x += parseInt(e.dx != 0 ? e.dx / (Math.round(scale * 100) / 100) : e.dx, 10) || 0 : position.x = 0
        // position.y >= 0 ? position.y += parseInt(e.dy != 0 ? e.dy / (Math.round(scale * 100) / 100) : e.dy, 10) || 0 : position.y = 0
        //        console.log(transformProp)
        if (i.x <= 0) { i.x = 0 }
        if (i.y <= 0) { i.y = 0 }
        if (i.x >= lienzoLimit.x) { i.x = lienzoLimit.x }
        if (i.y >= lienzoLimit.y) { i.y = lienzoLimit.y }
        // if (transformProp) {
        //   e.target.style[transformProp] = 'translate(' + position.x + 'px, ' + position.y + 'px)'
        // } else {
        //   e.target.style.left = position.x + 'px'
        //   e.target.style.top = position.y + 'px'
        // }
        // console.log(i)
      },
      end(e) {
        // const position = dragPositions[e.target.id]
        ActualizarPosicion({ x: i.x, y: i.y, event: event, targetID: e.target.getAttribute('id'), setEvent: setEvent, planSpaceActive, setPlanSpaceActive })
        //e.target.style[transformProp] = 'translate(' + i.x + 'px, ' + i.y + 'px)'
        e.target.style.left = i.x + 'px'
        e.target.style.top = i.y + 'px'
        e.target.setAttribute('data-x', i.x)
        e.target.setAttribute('data-y', i.y)
      },
    },
  })

  /* eslint-disable multiline-ternary */
  // interact(document).on('ready', () => {
  //   console.log("!aqui")
  //   transformProp =
  //     'transform' in document.body.style
  //       ? 'transform'
  //       : 'webkitTransform' in document.body.style
  //         ? 'webkitTransform'
  //         : 'mozTransform' in document.body.style
  //           ? 'mozTransform'
  //           : 'oTransform' in document.body.style
  //             ? 'oTransform'
  //             : 'msTransform' in document.body.style
  //               ? 'msTransform'
  //               : null
  // })
  /* eslint-enable multiline-ternary */

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

  return (
    <>
      {planSpaceActive?.tables?.map((item: table, idx) => {
        return (
          <DragableDefault key={item._id} item={item} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} prefijo='table' setShowFormEditar={setShowFormEditar}>
            <div className='rotate-[0deg]'>
              <MesaContent
                key={item._id}
                table={item}
                DefinePosition={DefinePosition}
                setDisableWrapper={setDisableWrapper}
                disableDrag={disableDrag}
                setShowFormEditar={setShowFormEditar}
              />
            </div>
          </DragableDefault>
        );
      })}
      {planSpaceActive?.elements?.map((item: element, idx) => {
        return (
          <DragableDefault key={item._id} item={item} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} prefijo="element" setShowFormEditar={setShowFormEditar}>
            <ElementContent
              key={item._id}
              item={item}
              DefinePosition={DefinePosition}
              setDisableWrapper={setDisableWrapper}
              disableDrag={disableDrag}
              setShowFormEditar={setShowFormEditar}
            />
          </DragableDefault>
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