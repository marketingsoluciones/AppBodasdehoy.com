/**
 * /pro — Página de planes de Memories (Gratis / Boda / Boda Plus).
 * Boda y Boda Plus son pagos únicos (plan_type: 'module').
 */
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { usePlan } from '../../hooks/usePlan';
import { TIER_COLORS } from '@bodasdehoy/shared/plans';
import WeddingDetailsModal, { type WeddingDetails } from '../../components/checkout/WeddingDetailsModal';

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'memories';

// Static feature map (matches DB plan_ids)
const PLAN_FEATURES: Record<string, Array<{ text: string; highlight?: boolean }>> = {
  'memories-free': [
    { text: '1 evento' },
    { text: '50 fotos' },
    { text: '7 días de acceso' },
    { text: 'QR compartible' },
    { text: 'Descarga individual' },
  ],
  'memories-boda': [
    { text: '300 fotos', highlight: true },
    { text: '6 meses de acceso' },
    { text: 'QR compartible' },
    { text: 'Descarga ZIP' },
    { text: 'Álbumes por momentos' },
    { text: 'Slideshow en directo' },
  ],
  'memories-boda-plus': [
    { text: 'Fotos ilimitadas', highlight: true },
    { text: '6 meses de acceso' },
    { text: 'QR compartible' },
    { text: 'Descarga ZIP' },
    { text: 'Álbumes por momentos' },
    { text: 'Slideshow en directo' },
    { text: 'Personalización (colores, nombres)', highlight: true },
    { text: 'Moderación IA', highlight: true },
    { text: 'Destacar fotos favoritas', highlight: true },
    { text: 'Experiencia más premium', highlight: true },
  ],
};

async function handlePurchase(planId: string, details?: WeddingDetails) {
  const authState = (await import('@bodasdehoy/shared')).authBridge.getSharedAuthState();
  if (!authState.idToken) {
    window.location.href = '/app';
    return null;
  }

  const res = await fetch(API2_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.idToken}`,
      'X-Development': DEVELOPMENT,
    },
    body: JSON.stringify({
      query: `mutation SubscribeToPlan($plan_id: String!, $billing_period: String, $success_url: String!, $cancel_url: String!, $metadata: JSON) {
        subscribeToPlan(plan_id: $plan_id, billing_period: $billing_period, success_url: $success_url, cancel_url: $cancel_url, metadata: $metadata) {
          success checkout_url session_id plan_name errors { message }
        }
      }`,
      variables: {
        plan_id: planId,
        billing_period: 'monthly',
        success_url: `${window.location.origin}/app?upgraded=1`,
        cancel_url: `${window.location.origin}/pro?cancelled=1`,
        metadata: details
          ? {
              customer_email: details.email,
              customer_name: details.nombre,
              wedding_date: details.fechaBoda,
              wedding_location: details.ubicacion,
              customer_phone: details.telefono,
            }
          : undefined,
      },
    }),
  });

  const json = await res.json();
  const result = json.data?.subscribeToPlan;
  if (result?.checkout_url) {
    window.location.href = result.checkout_url;
  }
  return result;
}

export default function ProPage() {
  const { allPlans, tier, loading } = usePlan();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPlanId, setModalPlanId] = useState<string | null>(null);

  // Sort by price ascending
  const plans = allPlans
    .filter((p) => p.is_active !== false)
    .sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee);

  const selectedPlan = plans.find((p) => p.plan_id === modalPlanId);

  const handleChoosePlan = (planId: string) => {
    setError(null);
    // Show wedding details form before checkout
    setModalPlanId(planId);
  };

  const handleConfirmDetails = async (details: WeddingDetails) => {
    if (!modalPlanId) return;
    setPurchasing(modalPlanId);
    try {
      const result = await handlePurchase(modalPlanId, details);
      if (result && !result.success) {
        setError(result.errors?.[0]?.message ?? 'Error al procesar el pago. Inténtalo de nuevo.');
        setModalPlanId(null);
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
      setModalPlanId(null);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <>
      <Head>
        <title>Planes — Memories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <span className="text-lg font-bold text-rose-500">Memories</span>
            </Link>
            <Link href="/app" className="text-sm text-gray-500 hover:text-gray-800 transition">
              Ir a mis álbumes
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          {/* Title */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">Planes</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Elige el plan perfecto para tu boda
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Sin suscripciones. Pago único para tu evento.
              Todos los planes incluyen subida colaborativa de fotos y QR para compartir.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-8 text-sm text-center">
              {error}
            </div>
          )}

          {/* Plans grid */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 gap-3">
              <span className="text-4xl">📋</span>
              <p className="text-base font-medium">No hay planes disponibles.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {plans.map((plan) => {
                const isHighlighted = plan.plan_id === 'memories-boda-plus';
                const isCurrent = plan.tier === tier;
                const isFree = plan.pricing.monthly_fee === 0;
                const isOneTime = (plan as any).plan_type === 'module';
                const features = PLAN_FEATURES[plan.plan_id] ?? [];
                const tierColor = TIER_COLORS[plan.tier] ?? '#6b7280';

                return (
                  <div
                    key={plan.plan_id}
                    className={`rounded-3xl p-8 border transition ${
                      isHighlighted
                        ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105'
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Popular badge */}
                    {isHighlighted && (
                      <div className="text-center mb-4">
                        <span className="bg-white text-rose-500 text-xs font-bold px-3 py-1 rounded-full">
                          ✨ Más popular
                        </span>
                      </div>
                    )}

                    {/* Plan name + dot */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isHighlighted ? 'white' : tierColor }}
                      />
                      <h3 className={`text-lg font-bold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-1 mb-1">
                      <span className={`text-4xl font-extrabold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                        {isFree ? 'Gratis' : `€${plan.pricing.monthly_fee}`}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold mb-6 ${isHighlighted ? 'text-rose-100' : 'text-gray-400'}`}>
                      {isFree ? 'siempre gratis' : 'pago único'}
                    </p>

                    {/* CTA */}
                    {isCurrent ? (
                      <div
                        className={`text-center py-3 rounded-2xl font-bold text-sm border-2 mb-6 ${
                          isHighlighted ? 'border-white/50 text-white' : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        Plan actual
                      </div>
                    ) : isFree ? (
                      <Link
                        href="/app"
                        className="block text-center w-full py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition mb-6"
                      >
                        Empezar gratis
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleChoosePlan(plan.plan_id)}
                        disabled={purchasing === plan.plan_id}
                        className={`w-full py-3 rounded-2xl font-bold text-sm transition disabled:opacity-50 mb-6 ${
                          isHighlighted
                            ? 'bg-white text-rose-500 hover:bg-rose-50'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}
                      >
                        {purchasing === plan.plan_id
                          ? 'Procesando...'
                          : `Elegir ${plan.name} — €${plan.pricing.monthly_fee}`}
                      </button>
                    )}

                    {/* Features */}
                    <ul className="space-y-2.5">
                      {features.map((f, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 text-sm ${
                            isHighlighted ? 'text-rose-50' : 'text-gray-600'
                          }`}
                        >
                          <span className={`mt-0.5 flex-shrink-0 font-bold ${isHighlighted ? 'text-white' : 'text-rose-500'}`}>
                            ✓
                          </span>
                          <span className={f.highlight && !isHighlighted ? 'font-semibold text-gray-800' : ''}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Referral callout */}
          <div className="mt-12 bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">
            <p className="text-rose-700 font-semibold text-base mb-1">
              🎁 ¿Conoces a otros novios?
            </p>
            <p className="text-rose-500 text-sm">
              Invita a 5 parejas y consigue <strong>1 evento Boda gratis</strong>.{' '}
              <Link href="/app/referral" className="underline font-semibold hover:text-rose-700">
                Ver mi contador →
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Precios sin IVA. Pago único sin renovación automática.
          </p>
        </main>
      </div>

      {modalPlanId && selectedPlan && (
        <WeddingDetailsModal
          planName={selectedPlan.name}
          planPrice={selectedPlan.pricing.monthly_fee}
          onConfirm={handleConfirmDetails}
          onClose={() => setModalPlanId(null)}
          loading={purchasing === modalPlanId}
        />
      )}
    </>
  );
}
