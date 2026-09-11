import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ClickAwayListener from 'react-click-away-listener'

const ModalLeft = ({ children, state, set, clickAwayListened = true, studio = false, ...rest }) => {
  const [initial, setInitial] = useState("-translate-x-full")
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let timeout = setTimeout(() => {
      setInitial("translate-x-0")
    }, 100);
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  const content = (
    <>
      <div 
        className={`fixed top-0 left-0 w-full h-screen bg-black/60 transition-opacity duration-300 ${state ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} `} 
        style={{ zIndex: state ? 70 : -1 }}
      />
      <ClickAwayListener onClickAway={() => (state && clickAwayListened) && set(false)} >
        <div
          className={`bg-white fixed top-0 left-0 h-full shadow-lg flex flex-col transform transition duration-300 w-full ${studio ? "md:w-[440px] max-w-[92vw]" : "md:w-[400px] md:rounded-r-2xl items-center justify-start"} ${state ? initial : "-translate-x-full"} `}
          style={{ zIndex: state ? 80 : -1 }}
          {...rest} >
          {!studio && <span
            id='close'
            onClick={() => set(!state)}
            className={`font-display bg-gray-200 md:bg-gray-100 hover:bg-gray-200 w-10 h-10 md:w-10 md:h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer text-2xl absolute md:translate-x-14 translate-y-4 ${state ? "opacity-100" : "opacity-0"}`} >X</span>}
          {studio ? (
            children
          ) : (
            // MOB-04 QA #34 (29-jun): justify-start + pb-24 para no dejar el submit fuera del viewport.
            <div className='flex w-full items-start p-6 md:p-12 overflow-y-auto h-full pb-24'>
              {children}
            </div>
          )}
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

  if (studio && mounted && typeof document !== "undefined") return createPortal(content, document.body)
  return content
}

export default ModalLeft
