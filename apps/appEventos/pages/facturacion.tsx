import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { MetodosDePago, InformacionFacturacion, HistorialFacturacion } from "../components/Facturacion"
import { countries_eur } from "../utils/Currencies"
import VistaSinCookie from "./vista-sin-cookie"
import { usePlanLimits } from "../hooks/usePlanLimits"
import { humanizeQuota, TIER_COLORS } from "@bodasdehoy/shared/plans"

/** Sección de Planes API2 — muestra los planes de suscripción reales */
const PlanesAPI2 = () => {
    const { allPlans, tier, loading } = usePlanLimits()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
            </div>
        )
    }

    const sortedPlans = allPlans
        .filter((p) => p.is_active !== false)
        .sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee)

    if (sortedPlans.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center text-gray-400 gap-2">
            <span className="text-2xl">💳</span>
            <p className="text-sm">No hay planes disponibles en este momento.</p>
            <p className="text-xs">Inténtalo de nuevo más tarde.</p>
        </div>
    )

    const RELEVANT_SKUS = ['events-count', 'guests-per-event', 'ai-tokens', 'whatsapp-msg', 'email-campaigns', 'sms-invitations']

    return (
        <div className="w-full space-y-6 mt-4">
            {/* Billing toggle */}
            <div className="flex justify-center">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                    >
                        Anual <span className="text-xs text-pink-500 font-bold ml-1">-20%</span>
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {sortedPlans.slice(0, 4).map((plan) => {
                    const isPro = plan.tier === 'PRO'
                    const isCurrent = plan.tier === tier
                    const isFree = plan.tier === 'FREE'
                    const price = billingPeriod === 'yearly' && plan.pricing.annual_fee
                        ? (plan.pricing.annual_fee / 12)
                        : plan.pricing.monthly_fee
                    const tierColor = TIER_COLORS[plan.tier] ?? '#6b7280'

                    const features = plan.product_limits
                        .filter((l) => RELEVANT_SKUS.includes(l.sku))
                        .map((l) => ({ label: l.service_name, value: humanizeQuota(l.sku, l.free_quota) }))

                    return (
                        <div
                            key={plan.plan_id}
                            className={`rounded-2xl p-6 border transition ${
                                isPro
                                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-pink-500 shadow-lg'
                                    : isCurrent
                                        ? 'bg-white border-pink-300 shadow-md ring-2 ring-pink-200'
                                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isPro ? 'white' : tierColor }} />
                                <h3 className={`text-base font-bold ${isPro ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                                {isCurrent && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-semibold">Actual</span>}
                            </div>
                            <div className="flex items-end gap-1 mb-4">
                                <span className={`text-3xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                                    {isFree ? 'Gratis' : `${price.toFixed(2)}\u20AC`}
                                </span>
                                {!isFree && <span className={`text-sm mb-1 ${isPro ? 'text-pink-200' : 'text-gray-400'}`}>/mes</span>}
                            </div>
                            <ul className="space-y-2 mb-4">
                                {features.map((f) => (
                                    <li key={f.label} className={`flex items-center justify-between text-sm ${isPro ? 'text-pink-100' : 'text-gray-600'}`}>
                                        <span className="flex items-center gap-1.5">
                                            <span className={isPro ? 'text-white' : 'text-pink-500'}>&#10003;</span>
                                            {f.label}
                                        </span>
                                        <span className={`font-semibold ${isPro ? 'text-white' : 'text-gray-900'}`}>{f.value}</span>
                                    </li>
                                ))}
                            </ul>
                            {!isCurrent && (
                                <button
                                    className={`w-full py-2 rounded-xl font-semibold text-sm transition ${
                                        isPro
                                            ? 'bg-white text-pink-600 hover:bg-pink-50'
                                            : 'bg-pink-500 text-white hover:bg-pink-600'
                                    }`}
                                >
                                    {`Elegir ${plan.name}`}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
                Precios sin IVA. El IVA aplicable se calcula en el checkout según tu país. Cancela cuando quieras.
            </p>
        </div>
    )
}

const Facturacion = () => {
    const { forCms, user, config, geoInfo, verificationDone } = AuthContextProvider()
    const [dataFetch, setDataFetch] = useState<any>({})
    const [data, setData] = useState([])
    const [optionSelect, setOptionSelect] = useState(0)
    const [currency, setCurrency] = useState(countries_eur.includes(geoInfo?.ipcountry?.toLowerCase()) ? "eur" : "usd")
    const [stripeCurrency, setStripeCurrency] = useState(null)

    useEffect(() => {
        if (user?.uid && user.displayName !== "guest") {
            fetchApiBodas({
                query: queries.getAllProducts,
                variables: { grupo: "app" },
                development: config.development
            }).then(results => {
                setDataFetch(results)
                setStripeCurrency(results?.currency)
            })
        }
    }, [])

    useEffect(() => {
        const data = dataFetch?.results?.map(elem => {
            const price = elem?.prices?.find(el => data?.currency
                ? el?.currency === data.currency
                : el?.currency === currency)
            return { ...elem, prices: [price] }
        })
        const dataSort = data?.sort((a, b) => {
            if (a.usage !== b.usage) {
                return b.usage - a.usage
            }
        })
        setData(dataSort)
    }, [user, dataFetch, currency])


    const ComponentesArray = [
        {
            title: "Planes",
            componente: <PlanesAPI2 />
        },
        {
            title: "Métodos de pago",
            componente: <MetodosDePago setOptionSelect={setOptionSelect} stripeCurrency={stripeCurrency} />
        },
        {
            title: "Información de Facturación",
            componente: <InformacionFacturacion />
        },
        {
            title: "Historial de facturación",
            componente: <HistorialFacturacion />
        },
    ]
    if (verificationDone) {
        if (!user) {
            return (
                <VistaSinCookie />
            )
        }
        return (
            <>
                <section className={forCms ? " w-[calc(100vw-40px)] " : "bg-base w-full"}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:max-w-screen-lg mx-auto md:px-3 px-2 flex-col flex mt-3 pb-20">
                        <div className="flex justify-center md:border-b md:space-x-8 px-0.5 overflow-x-auto md:overflow-x-hidden items-center text-center  ">
                            {ComponentesArray.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`${optionSelect === idx ? "text-primary md:border-b  md:border-primary " : ""}  cursor-pointer md:hover:border-b  md:border-primary text-gray-700 text-[10px] md:text-[16px] px-5`}
                                    onClick={() => setOptionSelect(idx)}
                                >
                                    {item.title}
                                </div>
                            ))}
                        </div>
                        <div className="h-[calc(100vh-270px)] w-full flex items-start justify-center">
                            {ComponentesArray[optionSelect].componente}
                        </div>
                    </motion.div>
                </section>
            </>
        )
    }
}

export default Facturacion