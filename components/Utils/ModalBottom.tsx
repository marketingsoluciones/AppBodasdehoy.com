import React, { useEffect, useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'

const ModalBottom = ({children, state, set, ...rest}) => {
    const [initial, setInitial] = useState("translate-y-full")
  
    useEffect(() => {
      let timeout = setTimeout(() => {
        setInitial("translate-y-0")
      }, 100);
      return () => {
        clearTimeout(timeout)
      }
    }, [])


    return (
        <>
            <ClickAwayListener onClickAway={() => state && set(false)} >
          <div 
          className={`w-full overflow-auto no-scrollbar max-w-screen-lg h-max max-h-[90%] p-5 md:px-2 z-50 fixed bg-white md:px-12 py-6 bottom-0 mx-auto inset-x-0  rounded-t-3xl shadow-lg transform transition duration-300 ${state ? initial : "translate-y-full" } `} {...rest} >
            <span 
              onClick={() => set(!state)}
              className="hidden md:block font-display text-gray-500 hover:text-gray-300 transition cursor-pointer text-2xl absolute top-5 right-5">X</span>
            {children}
          </div>
          </ClickAwayListener>
          <style jsx>
              {`
              .backlayout::before {
                content:"";
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                position: absolute;
                z-index: 70;
                top: 0;
                right: 0;
                
  
              }
              `}
          </style>
        </>
    )
}

export default ModalBottom
