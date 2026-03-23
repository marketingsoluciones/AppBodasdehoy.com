import { useState } from "react"
import { AuthContextProvider } from "../../context"
import { useTranslation } from 'react-i18next';

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';

async function openCustomerPortal(token: string, development: string, returnUrl: string) {
    const res = await fetch(API2_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Development': development,
        },
        body: JSON.stringify({
            query: `mutation CreateCustomerPortalSession($return_url: String!) {
                createCustomerPortalSession(return_url: $return_url) {
                    success portal_url
                }
            }`,
            variables: { return_url: returnUrl },
        }),
    });
    const json = await res.json();
    return json.data?.createCustomerPortalSession ?? { success: false };
}

export const MetodosDePago = ({ setOptionSelect }: { setOptionSelect: (n: number) => void; stripeCurrency?: string }) => {
    const { t } = useTranslation();
    const { config } = AuthContextProvider()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOpenPortal = async () => {
        setLoading(true)
        setError(null)
        try {
            const { getAuth } = await import('firebase/auth')
            const auth = getAuth()
            const token = await auth.currentUser?.getIdToken()
            if (!token) throw new Error('No autenticado')

            const development = (config as any)?.development || 'bodasdehoy'
            const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/facturacion` : ''
            const result = await openCustomerPortal(token, development, returnUrl)

            if (result.success && result.portal_url) {
                window.location.href = result.portal_url
            } else {
                // Portal no disponible en este plan — redirigir a planes
                setOptionSelect(0)
            }
        } catch (err) {
            console.error('[MetodosDePago] Error abriendo portal:', err)
            setError('No se pudo abrir el portal de pagos. Inténtalo de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md border rounded-2xl p-10 space-y-4 bg-white shadow-lg mt-3">
            <div className="text-4xl">💳</div>
            <h1 className="text-[18px] font-semibold text-center">{t("nopaymentmethods")}</h1>
            <p className="text-center text-[13px] text-gray-600">
                Gestiona tus tarjetas y métodos de pago de forma segura a través del portal de Stripe.
            </p>

            {error && (
                <p className="text-red-500 text-[13px] text-center">{error}</p>
            )}

            <button
                disabled={loading}
                onClick={handleOpenPortal}
                className="bg-primary text-white py-2 px-6 rounded-lg text-[14px] font-semibold disabled:opacity-50 w-full"
            >
                {loading ? 'Abriendo portal...' : '🔐 Gestionar métodos de pago'}
            </button>

            <button
                onClick={() => setOptionSelect(0)}
                className="text-[12px] text-gray-400 hover:text-gray-600 underline"
            >
                Ver planes de suscripción
            </button>
        </div>
    )
}
