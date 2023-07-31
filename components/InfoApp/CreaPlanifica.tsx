import { useRouter } from "next/router"
import router from "next/router";

export const CreaPlanifica = () => {
    const router = useRouter()
    return (
        <>
            
                <div className=" h-96 md:h-screen relative md:mb-24 font-display">
                    <img src="/Mask.png" alt="Img banner" className=" " />
                    <div className="absolute md:-bottom-20 -bottom-28 md:inset-x-1/4 px-10">
                        <CuadroInfo />
                    </div>
                </div>
            
        </>
    )

}

export const CuadroInfo = () => {
    return (
        <>
            <div className="flex justify-center ">
                <div className="bg-primaryOrg text-center py-10 px-8 rounded-3xl space-y-5">
                    <p className="md:text-3xl text-acento">Crea, planifica y conquista eventos memorables</p>
                    <p className="text-white ">
                        Plataforma única de planificación y organización, capaz de integrar cada detalle de tu evento.<br /><br />
                        No importa el tamaño o tipo de tu celebración que deseas realizar. Ahora puedes llevar <br /> las riendas de tu evento desde una sola herramienta.
                    </p>
                    <button onClick={()=> {router.push("/")}} className="bg-acento text-white py-2 px-3">CREA GRATIS TU EVENTO</button>
                </div>
            </div>
        </>
    )
}