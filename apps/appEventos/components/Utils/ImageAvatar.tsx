import { FC, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { detalle_compartidos_array } from "../../utils/Interfaces"

interface props {
  user: detalle_compartidos_array
  disabledTooltip?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

export const ImageAvatar: FC<props> = ({ user, disabledTooltip, size = "lg" }) => {
  // Posición del tooltip en coordenadas de viewport (position:fixed vía portal).
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const h = (str: string): string => {
    if (str) {
      str.slice(0, 2).charCodeAt(1).toString(16)
      const s = "#" + str.slice(0, 4).charCodeAt(2).toString(16) + str.slice(2, 7).charCodeAt(2).toString(16) + str.slice(5, 10).charCodeAt(2).toString(16)
      return s
    }
  }

  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const tooltipEnabled = !disabledTooltip && !["/itinerario", "/eventos"].includes(pathname)
  const label = user?.displayName ? user?.displayName : user?.email

  // Al hacer hover, calcular la posición del avatar y colocar el tooltip DEBAJO,
  // centrado. Se renderiza en un portal a document.body para que NO lo recorte
  // ningún contenedor con overflow:hidden (header/tarjeta del evento).
  const openTip = useCallback(() => {
    if (!tooltipEnabled || !label || !wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    setTip({ top: r.bottom + 6, left: r.left + r.width / 2 })
  }, [tooltipEnabled, label])

  return (
    <div ref={wrapRef} onMouseOver={openTip} onMouseOut={() => setTip(null)} className="w-full h-full relative">
      {!!(user?.photoURL || user?.icon)
        ?
        <div className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full overflow-hidden`}>
          <img src={
            user?.photoURL ? user?.photoURL : user?.icon
          }
            alt="Photo perfil"
            className="rounded-full truncate overflow-hidden"
          />
        </div>
        :
        <div
          style={{ backgroundColor: h(user?.uid?.slice(-11)) }}
          className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full ${size === "xs" ? "text-[10px]" : size === "sm" ? "text-[12px]" : size === "md" ? "text-[14px]" : size === "lg" ? "text-[16px]" : "text-[18px]"}`}
        >
          {
            user?.displayName
              ? (user?.displayName.split(" ").map(elem => elem.slice(0, 1).toUpperCase())).join("")
              : user?.email?.slice(0, 1)
          }
        </div>
      }
      {tip && label && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", top: tip.top, left: tip.left, transform: "translateX(-50%)", zIndex: 9999 }}
          className="bg-black rounded-md opacity-90 pointer-events-none max-w-[92vw]"
        >
          <span className="block text-white text-[10px] leading-[1.2] py-1 px-2 whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
        </div>,
        document.body
      )}
    </div>
  )
}
