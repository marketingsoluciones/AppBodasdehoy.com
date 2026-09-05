import React, { useState } from 'react'
import Head from 'next/head'
import { AuthContextProvider, EventContextProvider } from '../../context'
import { defaultImagenes } from '../Home/Card'
import { ModalAddUserToEvent, UsuariosCompartidos } from './Compartir'
import { IoShareSocial } from 'react-icons/io5'
import { DiGoogleDrive } from "react-icons/di";
import { Modal } from './Modal'
import { useTranslation } from 'react-i18next'
import { PermissionIndicator } from '../Servicios/Utils/PermissionIndicator'
import ClickAwayListener from 'react-click-away-listener'

/**
 * BlockTitle — encabezado estándar de módulo. Rediseño estético fiel al HTML
 * "Barra holder nueva" (radius 18, sombra suave, título 21px, badge de rol en
 * píldora, chip de evento a la derecha, botón compartir con hover rosa).
 * MISMOS datos y función: rol (PermissionIndicator), avatares/compartir
 * (UsuariosCompartidos + ModalAddUserToEvent), extras por módulo (Drive/Mesas).
 * La imagen del evento va a tamaño FIJO 40x40 (flex/shrink-0 + overflow) → nunca
 * estira el header (cierra BUG-CW-N28 sin necesidad de altura fija).
 */
export const BlockTitle = ({ title }) => {
  const { t } = useTranslation()
  const { forCms, user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [openModal, setOpenModal] = useState(false)
  const [openModalDrive, setOpenModalDrive] = useState(false)

  const isOwner = event?.usuario_id === user?.uid
  const canShare = isOwner && user?.displayName !== "guest"

  return (
    <div
      style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: "16px 24px", fontFamily: "'Poppins',sans-serif" }}
      className={`w-full ${forCms ? "hidden" : "flex"} items-center justify-between gap-5 max-w-screen-lg mx-auto`}
    >
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />

      {/* IZQUIERDA: título + badge de rol */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <span style={{ font: "700 21px Poppins", color: "#4a4a52" }} className="truncate">{t(title)}</span>
          <PermissionIndicator />
        </div>
        {/* móvil: tipo + nombre (no perder info en pantallas chicas) */}
        <div className="md:hidden mt-0.5 space-x-1">
          <span style={{ color: "#EF5B94" }} className="capitalize text-[12px] leading-[12px]">{event?.tipo}</span>
          <span className="capitalize text-gray-600 text-[12px] font-medium">{event?.nombre}</span>
        </div>
      </div>

      {/* DERECHA: avatares | divisor | evento | imagen | extras | compartir */}
      <div className="flex items-center gap-4 shrink-0">
        {/* avatares (datos reales + panel de permisos) */}
        <div onClick={() => { isOwner && setOpenModal(!openModal) }} className="flex items-center">
          <UsuariosCompartidos event={event} />
        </div>

        {/* divisor */}
        <div className="hidden md:block" style={{ width: 1, height: 30, background: "#eee" }} />

        {/* evento (tipo + nombre) */}
        <div className="hidden md:block text-right" style={{ lineHeight: 1.3 }}>
          <div style={{ font: "600 10px Poppins", color: "#EF5B94", letterSpacing: ".6px" }} className="uppercase">{event?.tipo}</div>
          <div style={{ font: "500 14px Poppins", color: "#3A3A42" }} className="uppercase truncate max-w-[120px] lg:max-w-[180px]">{event?.nombre}</div>
        </div>

        {/* imagen del evento — tamaño FIJO (no estira el header) */}
        <div className="hidden md:block shrink-0" style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", background: "#f2f2f4" }}>
          <img
            src={event?.imgEvento?.i320 ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${event.imgEvento.i320}`)}` : defaultImagenes[event?.tipo?.toLowerCase()]}
            alt={event?.nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes['otro']; }}
          />
        </div>

        {/* extra Presupuesto: Google Drive (WIP, comportamiento intacto) */}
        {title === "Presupuesto" && (
          <div onClick={() => "setOpenModalDrive(!openModalDrive)"} className="flex items-center justify-center cursor-pointer hover:bg-[#FCE7F0] rounded-[10px] transition" style={{ width: 38, height: 38, color: "#EF5B94" }}>
            <DiGoogleDrive style={{ width: 22, height: 22 }} />
          </div>
        )}

        {/* compartir */}
        <span
          onClick={() => { canShare && setOpenModal(!openModal) }}
          className={`flex items-center justify-center rounded-[10px] transition ${canShare ? "cursor-pointer hover:bg-[#FCE7F0]" : ""}`}
          style={{ width: 38, height: 38, color: canShare ? "#EF5B94" : "#d1d5db" }}
        >
          <IoShareSocial style={{ width: 16, height: 16 }} />
        </span>
      </div>

      {openModalDrive ? (
        <Modal {...({ openIcon: openModalDrive, setOpenIcon: setOpenModalDrive, classe: "h-max w-[40%] flex items-center justify-center" } as any)}>
          <div className='my-10 mx-32'>
            <img alt="Work in progress" src='/WIP.png' />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default React.memo(BlockTitle)
