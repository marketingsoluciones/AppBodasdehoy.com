import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TIER_COLORS } from '@bodasdehoy/shared/plans';

import { resolvePublicMcpGraphqlUrl } from '../../utils/endpoints';

const API2_URL = resolvePublicMcpGraphqlUrl();
const DEVELOPMENT = (process.env.NEXT_PUBLIC_DEVELOPMENT || 'memories').trim();

// Features per plan_id (static — must match what's in DB)
const PLAN_FEATURES: Record<string, string[]> = {
  'memories-free': [
    '1 evento',
    '50 fotos',
    '7 días de acceso',
    'QR compartible',
    'Descarga individual',
  ],
  'memories-evento': [
    '300 fotos',
    '6 meses de acceso',
    'QR compartible',
    'Descarga ZIP',
    'Álbumes por momentos',
    'Slideshow en directo',
  ],
  'memories-pro': [
    'Fotos ilimitadas',
    '6 meses de acceso',
    'QR compartible',
    'Descarga ZIP',
    'Álbumes por momentos',
    'Slideshow en directo',
    'Personalización (colores, nombres)',
    'Moderación IA',
    'Destacar fotos favoritas',
    'Experiencia premium',
  ],
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  'memories-free': 'Prueba la experiencia con tus invitados',
  'memories-evento': 'Tu evento organizado y compartido sin caos',
  'memories-pro': 'Convierte tu evento en una experiencia inolvidable',
};

// Highlighted plan
const HIGHLIGHTED_ID = 'memories-pro';

interface PlanData {
  plan_id: string;
  name: string;
  tier: string;
  pricing: { monthly_fee: number };
  plan_type?: string;
}

export default function Pricing() {
  const [apiPlans, setApiPlans] = useState<PlanData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(API2_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Development': DEVELOPMENT },
      body: JSON.stringify({
        query: `query { getSubscriptionPlans(development: "${DEVELOPMENT}", is_public: true) {
          plan_id name tier plan_type pricing { monthly_fee }
        }}`,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        const plans: PlanData[] = json.data?.getSubscriptionPlans ?? [];
        setApiPlans(plans.sort((a, b) => a.pricing.monthly_fee - b.pricing.monthly_fee));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const plans = loaded && apiPlans.length > 0 ? apiPlans : STATIC_PLANS;

  return (
    <section id="precios" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Transparente y sin sorpresas
          </h2>
          <p className="text-gray-500 mt-4">Empieza gratis. Paga solo si quieres más.</p>
        </div>

        <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
          {plans.map((plan) => {
            const isHighlighted = plan.plan_id === HIGHLIGHTED_ID;
            const isFree = plan.pricing.monthly_fee === 0;
            const isOneTime = plan.plan_type === 'module';
            const features = PLAN_FEATURES[plan.plan_id] ?? [];
            const description = PLAN_DESCRIPTIONS[plan.plan_id] ?? '';
            const tierColor = TIER_COLORS[plan.tier as keyof typeof TIER_COLORS] ?? '#6b7280';

            return (
              <div
                key={plan.plan_id}
                className={`rounded-3xl p-8 border transition ${
                  isHighlighted
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105'
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Badge */}
                {isHighlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-white text-rose-500 text-xs font-bold px-3 py-1 rounded-full">
                      ✨ Más popular
                    </span>
                  </div>
                )}

                {/* Name */}
                <h3
                  className={`text-lg font-bold mb-1 ${isHighlighted ? 'text-white' : 'text-gray-900'}`}
                  style={{ color: isHighlighted ? undefined : tierColor }}
                >
                  {plan.name}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-4 ${isHighlighted ? 'text-rose-100' : 'text-gray-500'}`}>
                  {description}
                </p>

                {/* Price */}
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                    {isFree ? 'Gratis' : `€${plan.pricing.monthly_fee}`}
                  </span>
                </div>
                {!isFree && (
                  <p className={`text-sm mb-6 font-semibold ${isHighlighted ? 'text-rose-100' : 'text-gray-400'}`}>
                    Pago único
                  </p>
                )}
                {isFree && <div className="mb-6" />}

                {/* CTA */}
                <Link
                  href="/pro"
                  className={`block text-center w-full py-3 rounded-2xl font-bold text-sm transition mb-6 ${
                    isHighlighted
                      ? 'bg-white text-rose-500 hover:bg-rose-50'
                      : isFree
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {isFree ? 'Empezar gratis' : `Elegir ${plan.name}`}
                </Link>

                {/* Features */}
                <ul className="space-y-2.5">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        isHighlighted ? 'text-rose-50' : 'text-gray-600'
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 ${isHighlighted ? 'text-white' : 'text-rose-500'}`}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Precios sin IVA. Sin suscripción. Sin permanencia.
        </p>
      </div>
    </section>
  );
}

// Static fallback (shown while API loads or if API fails)
const STATIC_PLANS: PlanData[] = [
  { plan_id: 'memories-free',    name: 'Gratis',  tier: 'FREE',  plan_type: 'user',   pricing: { monthly_fee: 0 } },
  { plan_id: 'memories-evento',  name: 'Evento',  tier: 'BASIC', plan_type: 'module', pricing: { monthly_fee: 19 } },
  { plan_id: 'memories-pro',     name: 'Pro',     tier: 'PRO',   plan_type: 'module', pricing: { monthly_fee: 39 } },
];
