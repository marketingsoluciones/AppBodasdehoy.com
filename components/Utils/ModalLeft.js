import React, { useEffect, useState } from 'react'
import ClickAwayListener from 'react-click-away-listener'

const ModalLeft = ({ children, state, set, clickAwayListened = true, ...rest }) => {
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
      <ClickAwayListener onClickAway={() => (state && clickAwayListened) && set(false)} >
        <div
          className={`bg-white w-full md:w-[400px] z-[60] fixed top-0 left-0 h-full md:rounded-r-2xl shadow-lg flex flex-col items-center justify-center transform transition duration-300 ${state ? initial : "-translate-x-full"} `} {...rest} >
          <span
            id='close'
            onClick={() => set(!state)}
            className="font-display bg-gray-200 md:bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition cursor-pointer text-2xl absolute md:translate-x-14 translate-y-4">X</span>
          <div className='flex w-full items-start p-12 overflow-auto'>
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
                #close {
    position: fixed;
    top: 10px;
    right: 10px;
}
              `}
      </style>
    </>
  )
}

export default ModalLeft
