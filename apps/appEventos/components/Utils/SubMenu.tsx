import { InvitadosIcon, MesaIcon } from "../icons"
import { GiGrandPiano } from 'react-icons/gi';
import { HiDocumentReport, HiTemplate } from 'react-icons/hi';
import { useTranslation } from "react-i18next";

// Barra de pestañas del módulo Mesas. Rediseño fiel al prototipo (MESAS.dc.html):
// tabs de icono + texto sobre fondo blanco, la activa con subrayado rosa marca.
// IMPORTANTE: NO cambiar los `title` (son los `itemSelect==` que enrutan el panel
// en pages/mesas.tsx) ni la altura del contenedor (h-10 alimenta el calc del panel).
const sutMenus = [
  {
    title: "invitados",
    icon: <InvitadosIcon className="w-[18px] h-[18px]" />,
  },
  {
    title: "planos",
    icon: <HiTemplate className="w-[18px] h-[18px]" />,
  },
  {
    title: "mesas",
    icon: <MesaIcon className="w-[18px] h-[18px]" />,
  },
  {
    title: "mobiliario",
    icon: <GiGrandPiano className="w-[18px] h-[18px]" />,
  },
  {
    title: "resumen",
    icon: <HiDocumentReport className="w-[18px] h-[18px]" />,
  },
]


export const SubMenu = ({ itemSelect, setItemSelect }) => {
  const { t } = useTranslation()

  const handleClick = (elem) => {
    setItemSelect(elem?.title)
  }

  return (
    <div className="w-full h-full flex items-stretch px-2 bg-white border-b border-[#f0f0f2]">
      {sutMenus.map((elem: any, idx: number) => {
        const active = elem.title === itemSelect
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(elem)}
            title={t(elem?.title)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 border-b-[2.5px] -mb-px transition-colors
              ${active ? "border-[#EF5B94]" : "border-transparent"}
              ${elem?.title === "invitados" ? "md:hidden" : ""}`}
          >
            <span className={active ? "text-[#EF5B94]" : "text-[#a0a0a8]"}>{elem?.icon}</span>
            <span className={`text-[10px] font-semibold capitalize leading-none truncate max-w-full ${active ? "text-[#EF5B94]" : "text-[#6b6b72]"}`}>{t(elem?.title)}</span>
          </button>
        )
      })}
    </div>
  )
}
