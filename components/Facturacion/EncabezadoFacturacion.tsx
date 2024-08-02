import { useRouter } from "next/router"
import { AuthContextProvider } from "../../context"
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { DiamanteIcon } from "../icons"
import { LiaCartArrowDownSolid } from "react-icons/lia"


export const EncabezadoFacturacion = ({ ProductsAddList }) => {
    const { user } = AuthContextProvider()
    const router = useRouter()
    const asd = ProductsAddList.map((elem) => {
        return {
            price: elem.priceID,
            quantity: 1
        }
    })
    const handleCheckout = () => {
        fetchApiBodas({
            query: queries.createCheckoutSession,
            variables: {
                items: asd,
                email: user?.email,
                cancel_url: `${window.location.href}`,
                success_url: `${window.location.href}`
            },
            development: "bodasdehoy"
        }).then((result) => {
            if (result != null) {
                router.push(result)
            }
        })
    }
    return (
        <div className="bg-white rounded-lg px-5 py-5 mt-3  ">
            <div className="flex  justify-between items-center">
                <div className="">
                    <div className="flex items-center space-x-1">
                        <p className="text-azulCorporativo text-[25px]">
                            Obten Full Acces
                        </p>
                        <DiamanteIcon className={`text-acento`} />
                    </div>
                    <p className="text-[13px] text-gray-400">Mejora la organizacion de tus eventos</p>
                    <p className="text-[13px] text-gray-400"> Si se suscribe en la mitad del ciclo de facturación, se le cobrará un monto parcial.</p>
                </div>
                <div className="relative flex h-max">
                    {ProductsAddList?.length > 0 && <span className="bg-primary w-5 h-5 absolute z-10 rounded-full border-2 border-primary flex items-center justify-center text-white translate-x-4 translate-y-1">{ProductsAddList?.length}</span>}
                    <LiaCartArrowDownSolid className="w-12 h-12 text-primary" />
                    <button
                        onClick={handleCheckout}
                        className={`${ProductsAddList.length ? "bg-primary" : "bg-gray-300"} text-white rounded-lg capitalize px-4 m-2`}
                        disabled={!ProductsAddList.length}>
                        pagar
                    </button>
                </div>
            </div>
        </div>
    )
}