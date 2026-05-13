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
      <div 
        className={`fixed top-0 left-0 w-full h-screen bg-black/60 transition-opacity duration-300 ${state ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} `} 
        style={{ zIndex: state ? 70 : -1 }}
      />
      <ClickAwayListener onClickAway={() => (state && clickAwayListened) && set(false)} >
        <div
          className={`bg-white w-full md:w-[400px] fixed top-0 left-0 h-full md:rounded-r-2xl shadow-lg flex flex-col items-center justify-center transform transition duration-300 ${state ? initial : "-translate-x-full"} `} 
          style={{ zIndex: state ? 80 : -1 }}
          {...rest} >
          <span
            id='close'
            onClick={() => set(!state)}
            className={`font-display bg-gray-200 md:bg-gray-100 hover:bg-gray-200 w-10 h-10 md:w-10 md:h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer text-2xl absolute md:translate-x-14 translate-y-4 ${state ? "opacity-100" : "opacity-0"}`} >X</span>
          <div className='flex w-full items-start p-6 md:p-12 overflow-auto h-full'>
            {children}
          </div>
        </div>
      </ClickAwayListener>
      <style jsx>
        {`
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
