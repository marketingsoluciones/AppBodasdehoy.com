import React, { useState } from 'react'
import { AuthContextProvider, EventContextProvider } from '../../context'
import { defaultImagenes } from '../Home/Card'
import { ModalAddUserToEvent, UsuariosCompartidos } from './Compartir'
import { CopiarLink } from './Compartir/CopiarLink'
import { IoShareSocial } from 'react-icons/io5'
import { DiGoogleDrive } from "react-icons/di";
import { MdOutlineChair } from "react-icons/md";
import { Modal } from './Modal'
import { useTranslation } from 'react-i18next'
import { PermissionIndicator } from '../Servicios/Utils/PermissionIndicator'
import ClickAwayListener from 'react-click-away-listener'


export const BlockTitle = ({ title }) => {
  const { t } = useTranslation()
  const { forCms, user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [openModal, setOpenModal] = useState(false)
  const [openModalDrive, setOpenModalDrive] = useState(false)
  const [showSeatingLink, setShowSeatingLink] = useState(false)

  const seatingUrl = event?._id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/buscador-mesa/${event._id}`
    : ''

  return (
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
          src={event?.imgEvento ? `https://apiapp.bodasdehoy.com/${event.imgEvento.i320}` : defaultImagenes[event?.tipo?.toLowerCase()]}
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
              className={`transition transform ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hover:scale-110 cursor-pointer text-primary" : "text-gray-300"} translate-y-2* -translate-x-1.5 md:-translate-y-3* ${title === "Presupuesto" ? "md:-translate-x-12" : "md:-translate-x-6"}`}
              onClick={() => { event?.usuario_id === user?.uid && user?.displayName !== "guest" && setOpenModal(!openModal) }}
            >
              <IoShareSocial className="w-6 h-6" />
            </span>
          </div>
          {
            title === "Presupuesto" ?
              <div onClick={() => "setOpenModalDrive(!openModalDrive)"} className='md:-translate-x-12 cursor-pointer'>
                <DiGoogleDrive className='w-[32px] h-[32px] text-primary' />
              </div> :
              null
          }
          {title === "Mesas y asientos" && event?._id && (
            <div className='relative md:-translate-x-10'>
              <button
                onClick={() => setShowSeatingLink(!showSeatingLink)}
                title="Compartir buscador de mesa"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition text-primary"
              >
                <MdOutlineChair className="w-5 h-5" />
              </button>
              {showSeatingLink && (
                <ClickAwayListener onClickAway={() => setShowSeatingLink(false)}>
                  <div className="absolute right-0 top-10 bg-white shadow-lg rounded-lg p-4 w-[300px] z-50 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      Link buscador de mesa para invitados (sin login)
                    </p>
                    <CopiarLink link={seatingUrl} />
                  </div>
                </ClickAwayListener>
              )}
            </div>
          )}
        </div>
      </div>
      {
        openModalDrive ?
          <Modal openIcon={openModalDrive} setOpenIcon={setOpenModalDrive} classe={"h-max w-[40%] flex items-center justify-center"}>
            <div className='my-10 mx-32'>
              <img src='/WIP.png' />
            </div>
          </Modal>
          : null
      }
    </div>
  )
}

export default React.memo(BlockTitle)
