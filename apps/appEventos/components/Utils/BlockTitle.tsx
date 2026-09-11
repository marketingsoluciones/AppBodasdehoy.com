import React, { useState } from 'react'
import Head from 'next/head'
import { AuthContextProvider, EventContextProvider } from '../../context'
import { defaultImagenes } from '../Home/Card'
import { ModalAddUserToEvent, UsuariosCompartidos } from './Compartir'
import { IoShareSocial } from 'react-icons/io5'
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

  const isOwner = event?.usuario_id === user?.uid
  const canShare = isOwner && user?.displayName !== "guest"

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />

      {/* ESCRITORIO: tarjeta redondeada estándar (título + rol + avatares/evento/compartir) */}
      <div
        style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 20px rgba(0,0,0,.06)", padding: "16px 24px", fontFamily: "'Poppins',sans-serif" }}
        className={`w-full ${forCms ? "hidden" : "hidden md:flex"} items-center justify-between gap-5 max-w-screen-lg mx-auto`}
      >
        {/* IZQUIERDA: título + badge de rol */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <span style={{ font: "700 21px Poppins", color: "#4a4a52" }} className="truncate">{t(title)}</span>
            <PermissionIndicator />
          </div>
        </div>

        {/* DERECHA: avatares | divisor | evento | imagen | compartir */}
        <div className="flex items-center gap-4 shrink-0">
          {/* avatares (datos reales + panel de permisos) */}
          <div onClick={() => { isOwner && setOpenModal(!openModal) }} className="flex items-center">
            <UsuariosCompartidos event={event} />
          </div>

          {/* divisor */}
          <div style={{ width: 1, height: 30, background: "#eee" }} />

          {/* evento (tipo + nombre) */}
          <div className="text-right" style={{ lineHeight: 1.3 }}>
            <div style={{ font: "600 10px Poppins", color: "#EF5B94", letterSpacing: ".6px" }} className="uppercase">{event?.tipo}</div>
            <div style={{ font: "500 14px Poppins", color: "#3A3A42" }} className="uppercase truncate max-w-[120px] lg:max-w-[180px]">{event?.nombre}</div>
          </div>

          {/* imagen del evento — tamaño FIJO (no estira el header) */}
          <div className="shrink-0" style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", background: "#f2f2f4" }}>
            <img
              src={event?.imgEvento?.i320 ? `/api/proxy-image?url=${encodeURIComponent(`https://api-mcp.eventosorganizador.com/${event.imgEvento.i320}`)}` : defaultImagenes[event?.tipo?.toLowerCase()]}
              alt={event?.nombre}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              onError={(e) => { (e.target as HTMLImageElement).src = defaultImagenes[event?.tipo?.toLowerCase()] || defaultImagenes['otro']; }}
            />
          </div>

          {/* compartir */}
          <span
            onClick={() => { canShare && setOpenModal(!openModal) }}
            className={`flex items-center justify-center rounded-[10px] transition ${canShare ? "cursor-pointer hover:bg-[#FCE7F0]" : ""}`}
            style={{ width: 38, height: 38, color: canShare ? "#EF5B94" : "#d1d5db" }}
          >
            <IoShareSocial style={{ width: 16, height: 16 }} />
          </span>
        </div>
      </div>

      {/* MÓVIL: cabecera limpia full-width (unificada, fiel a Invitaciones): solo título + TIPO · nombre.
          Márgenes negativos = padding del holder estándar (12px top / 16px horiz) → barra blanca a
          todo el ancho pegada al menú, idéntica en todos los módulos. */}
      {!forCms && (
        <div className="md:hidden bt-mob" style={{ margin: "-12px -16px 14px", padding: "13px 16px 12px", background: "#fff", borderBottom: "1px solid #f0f0f2", fontFamily: "'Poppins',sans-serif" }}>
          <div style={{ font: "700 19px Poppins", color: "#3A3A42" }}>{t(title)}</div>
          <div style={{ marginTop: 2 }}>
            <span style={{ font: "700 10px Poppins", color: "#EF5B94", letterSpacing: ".5px", textTransform: "uppercase" }}>{event?.tipo || "Boda"}</span>
            <span style={{ font: "500 11px Poppins", color: "#8a8a90", marginLeft: 5 }}>· {event?.nombre}</span>
          </div>
        </div>
      )}
    </>
  )
}

export default React.memo(BlockTitle)
