import { useTranslation } from "react-i18next";

// Barra de pestañas del módulo Mesas. Rediseño fiel al prototipo (MESAS.dc.html):
// tabs de SOLO texto (SIN iconos) sobre fondo blanco. La activa en rosa marca
// (#EF5B94) con subrayado rosa 2.5px; las inactivas en gris #9a9aa2 sin subrayado.
// Fuente 600 10.5px (spec exacto del proto, líneas 74-76 y B.tabs 712-716).
// IMPORTANTE: NO cambiar los `title` (son los `itemSelect==` que enrutan el panel
// en pages/mesas.tsx) ni la altura del contenedor (h-10 alimenta el calc del panel).
const sutMenus = [
  // `invitados` solo se muestra en móvil (md:hidden); en desktop Invitados es el
  // bloque colapsable inferior, por eso el proto solo tiene 4 tabs visibles.
  { title: "invitados" },
  { title: "planos" },
  { title: "mesas" },
  { title: "mobiliario" },
  { title: "resumen" },
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
            className={`flex-1 min-w-0 flex items-center justify-center border-b-[2.5px] -mb-px transition-colors
              ${active ? "border-[#EF5B94]" : "border-transparent"}
              ${elem?.title === "invitados" ? "md:hidden" : ""}`}
          >
            <span className={`text-[10.5px] font-semibold capitalize leading-none truncate max-w-full ${active ? "text-[#EF5B94]" : "text-[#9a9aa2]"}`}>{t(elem?.title)}</span>
          </button>
        )
      })}
    </div>
  )
}
