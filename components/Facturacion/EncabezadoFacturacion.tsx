import { useRouter } from "next/router"
import { AuthContextProvider } from "../../context"
import { fetchApiBodas, queries } from "../../utils/Fetching"
import { DiamanteIcon } from "../icons"
import { LiaCartArrowDownSolid } from "react-icons/lia"
import { useTranslation } from 'react-i18next';

export const EncabezadoFacturacion = ({ products, currency, setCurrency, stripeCurrency }) => {
    const { t } = useTranslation();
    const { user, config } = AuthContextProvider()
    const router = useRouter()

    const handleCheckout = () => {
        const items = products.map((elem) => {
            return {
                price: elem.prices[0].id,
                quantity: 1,
                metadata: { ...elem.metadata, productId: elem.id },
            }
        })
        const path = router?.query?.show === "iframe"
            ? window?.origin?.includes("://test.") ? `${process.env.NEXT_PUBLIC_CMS?.replace("//", "//test")}/facturacion` : `${process.env.NEXT_PUBLIC_CMS}/facturacion`
            : `${window.location.href}`
        fetchApiBodas({
            query: queries.createCheckoutSession,
            variables: {
                items: items,
                email: user?.email,
                cancel_url: path,
                success_url: path,
                mode: products.findIndex(el => el.prices[0].recurring) > -1 ? "subscription" : "payment"
            },
            development: config.development
        }).then((result) => {
            if (result != null) {
                router?.query?.show === "iframe"
                    ? window.parent.postMessage(JSON.stringify({ type: "route", path: result }), '*')
                    : router.push(result)
            }
        })
    }

    return (
        <div className="bg-white rounded-lg px-5 py-5 mt-3  ">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
                <div className="">
                    <div className="flex items-center space-x-1">
                        <p className="text-azulCorporativo text-[25px]">
                            {t("getfullaccess")}
                        </p>
                        <DiamanteIcon className={`text-acento`} />
                    </div>
                    <p className="text-[13px] text-gray-400">{t("improveorganization")}</p>
                    <p className="text-[13px] text-gray-400 pr-5">{t("billingcycle")}</p>
                </div>
                <div className="flex h-max items-center justify-center">
                    {!stripeCurrency && <select value={currency} className={`font-display text-gray-500 font-semibold text-lg text-center border-none focus:ring-0 ${!products.length && "cursor-pointer"}`} onChange={(e) => setCurrency(e.target.value)}  >
                        <option value={"eur"}>EUR</option>
                        <option value={"usd"}>USD</option>
                    </select>}
                    <div className="relative flex">
                        {products?.length > 0 && <span className="bg-primary w-5 h-5 absolute z-10 rounded-full border-2 border-primary flex items-center justify-center text-white translate-x-4 translate-y-1">{products?.length}</span>}
                        <LiaCartArrowDownSolid className="w-12 h-12 text-primary" />
                        <button
                            onClick={handleCheckout}
                            className={`${products.length ? "bg-primary" : "bg-gray-300"} text-white rounded-lg capitalize px-4 m-2 ml-4 md:ml-0`}
                            disabled={!products.length}>
                            pagar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}