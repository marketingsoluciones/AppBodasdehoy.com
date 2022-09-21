import interact from 'interactjs'
import { FC, useEffect, useState } from 'react'


export const BarraDesplazamiento = () => {
  const [slider, setSlider]: any = useState()
  useEffect(() => {
    console.log("algo")
    const slider = interact('.slider')
    console.log(slider)
    setSlider(slider)
    slider
      // Step 2
      .draggable({                        // make the element fire drag events
        origin: 'self',                   // (0, 0) will be the element's top-left
        inertia: true,                    // start inertial movement if thrown
        modifiers: [
          interact.modifiers.restrict({
            restriction: 'self'           // keep the drag coords within the element
          })
        ],
        // Step 3
        listeners: {
          move(event) {                  // call this listener on every dragmove
            const sliderWidth = interact.getElementRect(event.target).width
            const value = event.pageX / sliderWidth

            event.target.style.paddingLeft = (value * 100) + '%'
            event.target.setAttribute('data-value', value.toFixed(2))
          }
        }
      })
  }, [])

  return (
    <>
      <div className="sliders">
        <div className="slider"></div>
        <div className="slider"></div>
        <div className="slider"></div>
      </div>
      <style jsx>
        {`
        .sliders {
          padding: 1.5em
        }
        /* the slider bar */
        .slider {
          position: relative;
          width: 100%;
          height: 1em;
          margin: 1.5em auto;
          background-color: #29e;
          border-radius: 0.5em;
          box-sizing: border-box;

          font-size: 1em;

          -ms-touch-action: none;
            touch-action: none;
        }

        /* the slider handle */
        .slider:before {
          content: "";
          display: block;
          position: relative;
          top: -0.5em;

          width: 2em;
          height: 2em;
          margin-left: -1em;
          border: solid 0.25em #fff;
          border-radius: 1em;
          background-color: inherit;

          box-sizing: border-box;
        }

        /* display the value */
        .slider:after {
          content: attr(data-value);
          position: absolute;
          top: -1.5em;
          width: 2em;
          line-height:1em;
          margin-left: -1em;
          text-align: center;
        }}
      `}
      </style>
    </>
  )
}
