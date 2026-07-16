import { InvitadosIcon, MesaIcon } from "../icons"
import { GiGrandPiano } from 'react-icons/gi';
import { HiDocumentReport, HiTemplate } from 'react-icons/hi';
import { useTranslation } from "react-i18next";

// Barra de pestañas del módulo Mesas. Rediseño Fase A1 (16-jul): pastillas de texto
// limpias (activo = pastilla blanca con texto rosa marca; inactivo = texto blanco).
// IMPORTANTE: NO cambiar los valores `title` (son los `itemSelect==` que enrutan el
// panel en pages/mesas.tsx) ni la altura (el contenedor h-10 alimenta el calc del panel).
const sutMenus = [
  {
    title: "invitados",
    icon: <InvitadosIcon className="w-4 h-4" />,
  },
  {
    title: "planos",
    icon: <HiTemplate className="w-4 h-4" />,
  },
  {
    title: "mesas",
    icon: <MesaIcon className="w-4 h-4" />,
  },
  {
    title: "mobiliario",
    icon: <GiGrandPiano className="w-4 h-4" />,
  },
  {
    title: "resumen",
    icon: <HiDocumentReport className="w-4 h-4" />,
  },
]


export const SubMenu = ({ itemSelect, setItemSelect }) => {
  const { t } = useTranslation()

  const handleClick = (elem) => {
    setItemSelect(elem?.title)
  }

  return (
    <div className="w-full h-full flex items-center gap-1 px-1.5">
      {sutMenus.map((elem: any, idx: number) => {
        const active = elem.title === itemSelect
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(elem)}
            title={t(elem?.title)}
            className={`flex-1 min-w-0 h-[30px] flex items-center justify-center gap-1.5 rounded-full font-medium capitalize transition-colors
              ${active ? "bg-white text-primary shadow-sm" : "text-white/90 hover:bg-white/10"}
              ${elem?.title === "invitados" ? "md:hidden" : ""}`}
          >
            <span className="shrink-0">{elem?.icon}</span>
            <span className="text-[11px] leading-none truncate">{t(elem?.title)}</span>
          </button>
        )
      })}
    </div>
  )
}
