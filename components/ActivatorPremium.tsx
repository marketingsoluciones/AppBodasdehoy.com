import Link from "next/link"
import { DiamanteIcon } from "./icons"

export const ActivatorPremium = ({ link }) => {
  return (
    <div className="flex md:flex-row flex-col gap-4">
      <Link href={`/facturacion`}>
        <p className="flex gap-1 items-center">
          <DiamanteIcon />
          Activar la versión <span className="font-semibold cursor-pointer">PREMIUM</span>
        </p>
      </Link>
      <Link href={`/facturacion`}>
        <button className="text-sm text-white bg-primary px-7 py-1 rounded-lg" >
          Empezar
        </button>
      </Link>
    </div>
  )
}