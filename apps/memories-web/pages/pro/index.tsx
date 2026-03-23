/**
 * /pro — Página de planes de Memories.
 * Muestra los planes de API2 con CTAs para suscribirse vía Stripe.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { usePlan } from '../../hooks/usePlan';
import { humanizeQuota, TIER_COLORS } from '@bodasdehoy/shared/plans';

const MEMORIES_SKUS = ['memories-albums', 'memories-photos', 'storage-gb'];

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

async function handleSubscribe(planId: string, billingPeriod: 'monthly' | 'yearly' = 'monthly') {
  const authState = (await import('@bodasdehoy/shared')).authBridge.getSharedAuthState();
  if (!authState.idToken) {
    window.location.href = '/app'; // Will redirect to login
    return;
  }

  const res = await fetch(API2_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.idToken}`,
      'X-Development': DEVELOPMENT,
    },
    body: JSON.stringify({
      query: `mutation SubscribeToPlan($plan_id: String!, $billing_period: String, $success_url: String!, $cancel_url: String!) {
        subscribeToPlan(plan_id: $plan_id, billing_period: $billing_period, success_url: $success_url, cancel_url: $cancel_url) {
          success checkout_url session_id plan_name
        }
      }`,
      variables: {
        plan_id: planId,
        billing_period: billingPeriod,
        success_url: `${window.location.origin}/app?upgraded=1`,
        cancel_url: `${window.location.origin}/pro?cancelled=1`,
      },
    }),
  });

  const json = await res.json();
  const result = json.data?.subscribeToPlan;
  if (result?.checkout_url) {
    window.location.href = result.checkout_url;
  }
}

export default function ProPage() {
  const { allPlans, tier, loading } = usePlan();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const sortedPlans = allPlans
    .filter((p) => p.is_active !== false)
    .sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee);

  const handleChoosePlan = async (planId: string) => {
    setSubscribing(planId);
    try {
      await handleSubscribe(planId, billingPeriod);
    } finally {
      setSubscribing(null);
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
              Elige el plan perfecto para tus recuerdos
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Desde gratis hasta profesional. Todos los planes incluyen subida de fotos, QR para compartir, y protección con marca de agua.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${billingPeriod === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Anual
                <span className="ml-1 text-xs text-rose-500 font-bold">-20%</span>
              </button>
            </div>
          </div>

          {/* Plans grid */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 gap-3">
              <span className="text-4xl">📋</span>
              <p className="text-base font-medium">No hay planes disponibles en este momento.</p>
              <p className="text-sm">Por favor, inténtalo de nuevo más tarde.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {sortedPlans.map((plan) => {
                const isPro = plan.tier === 'PRO';
                const isCurrent = plan.tier === tier;
                const isFree = plan.tier === 'FREE';
                const price = billingPeriod === 'yearly' && plan.pricing.annual_fee
                  ? (plan.pricing.annual_fee / 12)
                  : plan.pricing.monthly_fee;
                const tierColor = TIER_COLORS[plan.tier] ?? '#6b7280';

                const memoriesFeatures = plan.product_limits
                  .filter((l) => MEMORIES_SKUS.includes(l.sku))
                  .map((l) => ({
                    label: l.service_name,
                    value: humanizeQuota(l.sku, l.free_quota),
                  }));

                return (
                  <div
                    key={plan.plan_id}
                    className={`rounded-3xl p-8 border transition ${
                      isPro
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 scale-105'
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Plan name */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: isPro ? 'white' : tierColor }}
                      />
                      <h3 className={`text-lg font-bold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-1 mb-2">
                      <span className={`text-4xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                        {isFree ? 'Gratis' : `${price.toFixed(2)}\u20AC`}
                      </span>
                      {!isFree && (
                        <span className={`text-sm mb-1.5 ${isPro ? 'text-indigo-200' : 'text-gray-400'}`}>
                          /mes
                        </span>
                      )}
                    </div>

                    {plan.description && (
                      <p className={`text-sm mb-6 ${isPro ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {plan.description}
                      </p>
                    )}

                    {/* CTA */}
                    {isCurrent ? (
                      <div className={`text-center py-3 rounded-2xl font-bold text-sm border-2 ${
                        isPro ? 'border-white/50 text-white' : 'border-gray-200 text-gray-500'
                      }`}>
                        Plan actual
                      </div>
                    ) : isFree ? (
                      <Link
                        href="/app"
                        className="block text-center w-full py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        Empezar gratis
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleChoosePlan(plan.plan_id)}
                        disabled={subscribing === plan.plan_id}
                        className={`w-full py-3 rounded-2xl font-bold text-sm transition disabled:opacity-50 ${
                          isPro
                            ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}
                      >
                        {subscribing === plan.plan_id
                          ? 'Procesando...'
                          : plan.pricing.trial_days
                            ? `Probar ${plan.pricing.trial_days} días gratis`
                            : `Elegir ${plan.name}`}
                      </button>
                    )}

                    {/* Features */}
                    <ul className="mt-6 space-y-3">
                      {memoriesFeatures.map((f) => (
                        <li
                          key={f.label}
                          className={`flex items-center justify-between text-sm ${
                            isPro ? 'text-indigo-100' : 'text-gray-600'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={isPro ? 'text-white' : 'text-rose-500'}>&#10003;</span>
                            {f.label}
                          </span>
                          <span className={`font-semibold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                            {f.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Todos los precios incluyen IVA. Puedes cancelar en cualquier momento.
          </p>
        </main>
      </div>
    </>
  );
}
