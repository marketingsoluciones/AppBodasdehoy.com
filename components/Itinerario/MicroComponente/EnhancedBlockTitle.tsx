import React, { useState } from 'react'
import { AuthContextProvider, EventContextProvider } from '../../../context'
import { defaultImagenes } from '../../Home/Card'
import { IoShareSocial } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { PermissionIndicator } from '../../Servicios/Utils/PermissionIndicator'
import { PermissionWrapper } from '../../Servicios/Utils/PermissionWrapper'
import { ModalAddUserToEvent, UsuariosCompartidos } from '../../Utils/Compartir'

interface EnhancedBlockTitleProps {
  title: string
}

export const EnhancedBlockTitle: React.FC<EnhancedBlockTitleProps> = ({ title }) => {
  const { t } = useTranslation()
  const { forCms, user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [openModal, setOpenModal] = useState(false)

  return (
    <PermissionWrapper>
      <div className={`w-full h-14 bg-white rounded-xl shadow-lg ${forCms ? "hidden" : "flex"} items-center justify-between max-w-screen-lg mx-auto`}>
        <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />
        <div className='flex md:flex-1 flex-col px-2 md:px-6 font-display'>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-[18px] leading-[20px] font-bold">{t(title)}</span>
            <PermissionIndicator />
          </div>
          <div className='space-x-1'>
            <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{event?.tipo}</span>
            <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[20px] font-medium'>{event?.nombre}</span>
          </div>
        </div>
        <div className='flex-1 md:flex-none md:w-[35%] h-[100%] flex flex-row-reverse md:flex-row items-center '>
          <img
            src={event?.imgEvento ? `https://apiapp.bodasdehoy.com/${event.imgEvento.i320}` : defaultImagenes[event?.tipo]}
            className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600  hidden md:block"
            alt={event?.nombre}
          />
          <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 md:pt-2 gap-2'>
            <span className='text-sm translate-y-2 text-primary text-[12px] first-letter:capitalize'>{event?.tipo}</span>
            <span className='uppercase w-64 truncate '>{event?.nombre}</span>
          </div>
          <div className='flex'>
            <div className='flex items-center justify-center'>
              <div onClick={() => { event?.usuario_id === user?.uid && setOpenModal(!openModal) }}
                className={`-translate-y-[13px] -translate-x-3 md:-translate-y-[15px] ${title === "Presupuesto" ? "md:-translate-x-14" : "md:-translate-x-8"} `}>
                <UsuariosCompartidos event={event} />
              </div>
              <span
                className={`transition transform ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hover:scale-110 cursor-pointer text-primary" : "text-gray-300"} z-30 translate-y-2* -translate-x-1.5 md:-translate-y-3* ${title === "Presupuesto" ? "md:-translate-x-[65px]" : title === "Lista de regalos" ? "md:-translate-x-[51px]" : "md:-translate-x-9"}`}
                onClick={() => event?.usuario_id === user?.uid && user?.displayName !== "guest" ? setOpenModal(!openModal) : {}}
              >
                <IoShareSocial className="w-6 h-6" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  )
}