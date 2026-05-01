import { useEffect, useState } from "react"
import { AuthContextProvider } from "../context"
import { motion } from "framer-motion"
import { fetchApiBodas, queries } from "../utils/Fetching"
import { MetodosDePago, InformacionFacturacion, HistorialFacturacion } from "../components/Facturacion"
import { countries_eur } from "../utils/Currencies"
import VistaSinCookie from "./vista-sin-cookie"
import { usePlanLimits } from "../hooks/usePlanLimits"
import { humanizeQuota, TIER_COLORS } from "@bodasdehoy/shared/plans"

import { resolveApiBodasGraphqlUrl } from "../utils/apiEndpoints"

const MCP_GRAPHQL_URL = resolveApiBodasGraphqlUrl()
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy'

async function handleSubscribePlan(planId: string, billingPeriod: 'monthly' | 'yearly') {
    const { authBridge } = await import('@bodasdehoy/shared')
    const authState = authBridge.getSharedAuthState()
    if (!authState.idToken) { window.location.href = '/login'; return }
    const res = await fetch(MCP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.idToken}`, 'X-Development': DEVELOPMENT },
        body: JSON.stringify({
            query: `mutation SubscribeToPlan($plan_id: String!, $billing_period: String, $success_url: String!, $cancel_url: String!) {
                subscribeToPlan(plan_id: $plan_id, billing_period: $billing_period, success_url: $success_url, cancel_url: $cancel_url) {
                    success checkout_url
                }
            }`,
            variables: { plan_id: planId, billing_period: billingPeriod, success_url: `${window.location.origin}/facturacion?upgraded=1`, cancel_url: `${window.location.origin}/facturacion?cancelled=1` },
        }),
    })
    const json = await res.json()
    const url = json.data?.subscribeToPlan?.checkout_url
    if (url) window.location.href = url
}

const QUOTA_SKUS = ['events-count', 'guests-per-event', 'ai-tokens', 'image-gen', 'whatsapp-msg', 'sms-invitations', 'storage-gb']

function getSupportLabel(r: any): string {
    if (r?.white_label) return 'Dedicado'
    if (r?.priority_support) return 'Prioritario'
    return 'Comunidad'
}

function extractFlags(plan: any): { label: string; included: boolean }[] {
    const r = plan.feature_restrictions ?? {}
    const flags = [
        { label: 'Copiloto IA', included: true },
        { label: 'Wallet prepago', included: true },
    ]
    if (plan.global_discount?.value) {
        flags.push({ label: `${plan.global_discount.value}% descuento en servicios`, included: true })
    } else {
        flags.push({ label: 'Descuentos en servicios', included: false })
    }
    flags.push({ label: `Soporte ${getSupportLabel(r)}`, included: true })
    if (r.api_access) flags.push({ label: 'API acceso completo', included: true })
    if (r.white_label) flags.push({ label: 'Gestor de cuenta dedicado', included: true })
    return flags
}

/** Sección de Planes API2 — muestra los planes de suscripción reales */
const PlanesAPI2 = () => {
    const { allPlans, tier, loading } = usePlanLimits()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
    const [subscribing, setSubscribing] = useState<string | null>(null)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
            </div>
        )
    }

    const allActive = allPlans.filter((p) => p.is_active !== false).sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee)
    const mainPlans = allActive.filter((p) => p.tier !== 'ENTERPRISE' && p.tier !== 'CUSTOM')
    const whitelabelPlan = allActive.find((p) => p.tier === 'ENTERPRISE')

    if (allActive.length === 0) return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center text-gray-400 gap-2">
            <span className="text-2xl">💳</span>
            <p className="text-sm">No hay planes disponibles en este momento.</p>
        </div>
    )

    const handleChoose = async (planId: string) => {
        setSubscribing(planId)
        try { await handleSubscribePlan(planId, billingPeriod) } finally { setSubscribing(null) }
    }

    return (
        <div className="w-full space-y-6 mt-4 overflow-y-auto pb-8">
            {/* Toggle mensual / anual */}
            <div className="flex justify-center">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button onClick={() => setBillingPeriod('monthly')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                        Mensual
                    </button>
                    <button onClick={() => setBillingPeriod('yearly')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                        Anual <span className="text-xs text-pink-500 font-bold ml-1">-20%</span>
                    </button>
                </div>
            </div>

            {/* 4 planes principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {mainPlans.map((plan) => {
                    const isPro = plan.tier === 'PRO'
                    const isCurrent = plan.tier === tier
                    const isFree = plan.tier === 'FREE'
                    const price = billingPeriod === 'yearly' && plan.pricing.annual_fee
                        ? (plan.pricing.annual_fee / 12)
                        : plan.pricing.monthly_fee
                    const tierColor = TIER_COLORS[plan.tier as keyof typeof TIER_COLORS] ?? '#374151'
                    const quotas = plan.product_limits.filter((l: any) => QUOTA_SKUS.includes(l.sku))
                    const flags = extractFlags(plan)

                    return (
                        <div
                            key={plan.plan_id}
                            className={`relative rounded-2xl p-5 border flex flex-col transition ${
                                isPro
                                    ? 'border-[#7c3aed] shadow-lg shadow-purple-100 ring-2 ring-[#7c3aed]/30'
                                    : isCurrent
                                        ? 'border-pink-300 shadow-md ring-2 ring-pink-100'
                                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                            }`}
                            style={isPro ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white' } : { background: 'white' }}
                        >
                            {isPro && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#eff6ff] text-[#1d4ed8] text-[11px] font-semibold px-3 py-0.5 rounded-full whitespace-nowrap border border-blue-200">
                                    ★ Más popular
                                </div>
                            )}
                            {isCurrent && !isPro && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-100 text-pink-600 text-[11px] font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                                    Plan actual
                                </div>
                            )}

                            {/* Nombre + precio */}
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isPro ? 'white' : tierColor }} />
                                <h3 className={`text-base font-bold ${isPro ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                            </div>
                            <div className="flex items-end gap-1 mb-1">
                                <span className={`text-3xl font-extrabold tracking-tight ${isPro ? 'text-white' : 'text-gray-900'}`}>
                                    {isFree ? 'Gratis' : `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}\u20AC`}
                                </span>
                                {!isFree && <span className={`text-sm mb-1 ${isPro ? 'text-purple-200' : 'text-gray-400'}`}>/mes</span>}
                            </div>
                            {!isFree && billingPeriod === 'yearly' && (
                                <p className={`text-[11px] mb-3 ${isPro ? 'text-purple-200' : 'text-gray-400'}`}>Facturado anualmente</p>
                            )}
                            {isFree && <p className={`text-[11px] mb-3 ${isPro ? 'text-purple-200' : 'text-gray-400'}`}>Siempre gratis</p>}
                            {!isFree && billingPeriod === 'monthly' && <div className="mb-3" />}

                            {/* CTA */}
                            {isCurrent ? (
                                <div className={`text-center py-2 rounded-xl font-semibold text-sm border-2 mb-4 ${isPro ? 'border-white/40 text-white' : 'border-gray-200 text-gray-400'}`}>
                                    Plan actual
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleChoose(plan.plan_id)}
                                    disabled={subscribing === plan.plan_id}
                                    className={`w-full py-2 rounded-xl font-semibold text-sm transition mb-4 disabled:opacity-50 ${
                                        isPro ? 'bg-white text-[#7c3aed] hover:bg-purple-50' : 'bg-pink-500 text-white hover:bg-pink-600'
                                    }`}
                                >
                                    {subscribing === plan.plan_id ? 'Procesando...' : isFree ? 'Empezar gratis' : `Probar 14 días gratis`}
                                </button>
                            )}

                            {/* Cuotas de uso */}
                            {quotas.length > 0 && (
                                <>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isPro ? 'text-purple-200' : 'text-gray-400'}`}>Incluye</p>
                                    <ul className="space-y-1.5 mb-3">
                                        {quotas.map((l: any) => (
                                            <li key={l.sku} className={`flex items-center justify-between text-xs ${isPro ? 'text-purple-100' : 'text-gray-600'}`}>
                                                <span className="flex items-center gap-1">
                                                    <span className={isPro ? 'text-white' : 'text-pink-500'}>✓</span>
                                                    {l.service_name}
                                                </span>
                                                <span className={`font-semibold ${isPro ? 'text-white' : 'text-gray-900'}`}>{humanizeQuota(l.sku, l.free_quota)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Feature flags */}
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isPro ? 'text-purple-200' : 'text-gray-400'}`}>Funcionalidades</p>
                            <ul className="space-y-1.5">
                                {flags.map((f) => (
                                    <li key={f.label} className={`flex items-center gap-1.5 text-xs ${isPro ? 'text-purple-100' : f.included ? 'text-gray-600' : 'text-gray-300'}`}>
                                        <span className={`flex-shrink-0 ${isPro ? 'text-white' : f.included ? 'text-pink-500' : 'text-gray-300'}`}>
                                            {f.included ? '✓' : '✗'}
                                        </span>
                                        {f.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>

            {/* Sección Whitelabel */}
            {whitelabelPlan && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-emerald-800 mb-1">Whitelabel</h3>
                            <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
                                Para empresas que quieren desplegar su propia marca blanca. Incluye instancia dedicada, Firebase propio, branding personalizado y soporte prioritario.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-3">
                                {[
                                    'Instancia dedicada', 'Firebase propio', 'Branding personalizado',
                                    'Copiloto IA', 'Wallet prepago', 'Soporte prioritario',
                                    'API acceso completo', 'Gestor de cuenta dedicado',
                                ].map((f) => (
                                    <div key={f} className="flex items-center gap-1.5 text-xs text-gray-700">
                                        <span className="text-emerald-600">✓</span>{f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0">
                            <div>
                                <span className="text-3xl font-extrabold text-gray-900">149€</span>
                                <span className="text-sm text-gray-400">/mes</span>
                            </div>
                            {tier === 'ENTERPRISE' ? (
                                <div className="text-center py-2 px-5 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-400">Plan actual</div>
                            ) : (
                                <button
                                    onClick={() => handleChoose(whitelabelPlan.plan_id)}
                                    disabled={subscribing === whitelabelPlan.plan_id}
                                    className="py-2 px-5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {subscribing === whitelabelPlan.plan_id ? 'Procesando...' : 'Probar 14 días gratis'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-gray-400">
                Todos los precios mostrados no incluyen IVA. El IVA aplicable se calculará en el checkout según tu país de facturación. Puedes cancelar en cualquier momento.
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
