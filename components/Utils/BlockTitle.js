import React from 'react'
import { AuthContextProvider, EventContextProvider } from '../../context'
import { defaultImagenes } from '../Home/Card'

const BlockTitle = ({ title }) => {
  const { forCms } = AuthContextProvider()
  const { event } = EventContextProvider()

  return (
    <div className={`w-full h-14 bg-white rounded-xl shadow-lg ${forCms ? "hidden" : "flex"} items-center justify-between`}>
      <div className='flex flex-col px-6 font-display'>
        <span className='capitalize text-gray-600 leading-[20px] font-medium'>{event?.nombre}</span>
        <span className='capitalize text-primary text-[12px] leading-[12px]'>{event?.tipo}</span>
        <span className="text-gray-500 text-[18px] leading-[20px] font-bold">
          {title}
        </span>
      </div>
      <div className='w-[23%] md:w-[35%] h-[100%] flex items-center '>

        <img
          src={defaultImagenes[event?.tipo]}
          className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600"
          alt={event?.nombre}
        />
        <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2'>
          <span className='text-sm translate-y-2'>Evento</span>
          <span className='uppercase w-64 truncate '>{event?.nombre}</span>
        </div>

      </div>
    </div>
  )
}

export default React.memo(BlockTitle)
