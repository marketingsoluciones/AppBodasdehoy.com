import React, { useEffect, useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'

const ModalLeft = ({ children, state, set, ...rest }) => {
  const [initial, setInitial] = useState("-translate-x-full")

  useEffect(() => {
    let timeout = setTimeout(() => {
      setInitial("translate-x-0")
    }, 100);
    return () => {
      clearTimeout(timeout)
    }
  }, [])


  return (
    <>
      <div className={`z-40 fixed top-0 left-0 w-full h-screen backdrop-filter backdrop-blur backlayout ${state ? "" : "hidden"} `} />
      <ClickAwayListener onClickAway={() => state && set(false)} >
        <div
          className={`bg-white w-full sm:w-1/3 lg:w-1/3 z-[60] fixed p-12 top-0 left-0 h-full md:rounded-r-2xl shadow-lg flex flex-col items-center justify-start transform transition duration-300 overflow-auto ${state ? initial : "-translate-x-full"} `} {...rest} >
          <span
            onClick={() => set(!state)}
            className="font-display text-gray-500 hover:text-gray-300 transition cursor-pointer text-2xl absolute top-5 right-5">X</span>
          <div className='flex-1 flex items-center'>
            {children}
          </div>
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

export default ModalLeft
