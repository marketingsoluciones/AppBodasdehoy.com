import React from 'react'
import { EventContextProvider } from '../../context'
import { defaultImagenes } from '../Home/Card'

const BlockTitle = ({ title }) => {
  const { event } = EventContextProvider()
  console.log(event)
  return (
    <div className="w-full h-14 bg-white rounded-xl shadow-lg flex items-center justify-between">
      <h1 className="font-display font-semibold text-2xl text-gray-500 px-6">
        {title}
      </h1>
      <div className='w-[23%] md:w-[35%] h-[100%] flex items-center '>

        <img
          src={defaultImagenes[event?.tipo]}
          className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600"
          alt={event?.nombre}
        />
        <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2'>
          <span className='text-sm translate-y-2'>Evento</span>
          <span className='uppercase w-64 truncate '>{event?.nombre}sdfsd sdf d</span>
        </div>

      </div>
    </div>
  )
}

export default React.memo(BlockTitle)
