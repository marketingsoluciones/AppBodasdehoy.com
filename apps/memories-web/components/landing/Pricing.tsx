import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { humanizeQuota, TIER_COLORS } from '@bodasdehoy/shared/plans';

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

const MEMORIES_SKUS = ['memories-albums', 'memories-photos', 'storage-gb'];

interface PlanData {
  plan_id: string;
  name: string;
  description?: string;
  tier: string;
  pricing: { monthly_fee: number; annual_fee?: number; trial_days?: number };
  product_limits: Array<{ sku: string; service_name: string; free_quota: number }>;
}

export default function Pricing() {
  const { t } = useTranslation('common');
  const [apiPlans, setApiPlans] = useState<PlanData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(API2_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Development': DEVELOPMENT },
      body: JSON.stringify({
        query: `query GetSubscriptionPlans($development: String!) {
          getSubscriptionPlans(development: $development, is_public: true) {
            plan_id name description tier
            pricing { monthly_fee annual_fee trial_days }
            product_limits { sku service_name free_quota }
          }
        }`,
        variables: { development: DEVELOPMENT },
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        const plans = json.data?.getSubscriptionPlans ?? [];
        setApiPlans(plans.sort((a: PlanData, b: PlanData) => a.pricing.monthly_fee - b.pricing.monthly_fee));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Fallback to i18n static plans if API fails or no plans returned
  const useApi = loaded && apiPlans.length > 0;

  if (!useApi) {
    // Original static rendering
    const staticPlans = [
      {
        name: t('pricing.free'),
        price: t('pricing.freePrice'),
        period: t('pricing.freePeriod'),
        desc: t('pricing.freeDesc'),
        features: t('pricing.freeFeatures', { returnObjects: true }) as string[],
        cta: t('pricing.freeCta'),
        highlighted: false,
      },
      {
        name: t('pricing.event'),
        price: t('pricing.eventPrice'),
        period: t('pricing.eventPeriod'),
        desc: t('pricing.eventDesc'),
        features: t('pricing.eventFeatures', { returnObjects: true }) as string[],
        cta: t('pricing.eventCta', { price: t('pricing.eventPrice') }),
        highlighted: true,
      },
      {
        name: t('pricing.pro'),
        price: t('pricing.proPrice'),
        period: t('pricing.proPeriod'),
        desc: t('pricing.proDesc'),
        features: t('pricing.proFeatures', { returnObjects: true }) as string[],
        cta: t('pricing.proCta'),
        highlighted: false,
      },
    ];

    return (
      <section id="precios" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('pricing.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('pricing.title')}</h2>
            <p className="text-gray-500 mt-4">{t('pricing.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {staticPlans.map((plan, i) => (
              <div key={i} className={`rounded-3xl p-8 border transition ${plan.highlighted ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-5xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price === '0' ? 'Gratis' : `\u20AC${plan.price}`}</span>
                  {plan.price !== '0' && <span className={`text-sm mb-2 ${plan.highlighted ? 'text-rose-100' : 'text-gray-400'}`}>/{plan.period}</span>}
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-rose-100' : 'text-gray-500'}`}>{plan.desc}</p>
                <Link href="/pro" className={`block text-center w-full py-3 rounded-2xl font-bold text-sm transition ${plan.highlighted ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-rose-500 text-white hover:bg-rose-600'}`}>
                  {plan.cta}
                </Link>
                <ul className="mt-6 space-y-3">
                  {(Array.isArray(plan.features) ? plan.features : []).map((f, j) => (
                    <li key={j} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-rose-50' : 'text-gray-600'}`}>
                      <span className={plan.highlighted ? 'text-white' : 'text-rose-500'}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">{t('pricing.disclaimer')}</p>
        </div>
      </section>
    );
  }

  // Dynamic API2 plans
  return (
    <section id="precios" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('pricing.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('pricing.title')}</h2>
          <p className="text-gray-500 mt-4">{t('pricing.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {apiPlans.slice(0, 3).map((plan) => {
            const isPro = plan.tier === 'PRO';
            const isFree = plan.tier === 'FREE';
            const tierColor = TIER_COLORS[plan.tier as keyof typeof TIER_COLORS] ?? '#6b7280';
            const features = plan.product_limits
              .filter((l) => MEMORIES_SKUS.includes(l.sku))
              .map((l) => `${l.service_name}: ${humanizeQuota(l.sku, l.free_quota)}`);

            return (
              <div
                key={plan.plan_id}
                className={`rounded-3xl p-8 border transition ${
                  isPro
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <h3 className={`text-lg font-bold mb-1 ${isPro ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-5xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                    {isFree ? 'Gratis' : `\u20AC${plan.pricing.monthly_fee.toFixed(0)}`}
                  </span>
                  {!isFree && (
                    <span className={`text-sm mb-2 ${isPro ? 'text-rose-100' : 'text-gray-400'}`}>/mes</span>
                  )}
                </div>
                {plan.description && (
                  <p className={`text-sm mb-6 ${isPro ? 'text-rose-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                )}
                <Link
                  href="/pro"
                  className={`block text-center w-full py-3 rounded-2xl font-bold text-sm transition ${
                    isPro
                      ? 'bg-white text-rose-500 hover:bg-rose-50'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {isFree
                    ? 'Empezar gratis'
                    : plan.pricing.trial_days
                      ? `Probar ${plan.pricing.trial_days} días gratis`
                      : `Elegir ${plan.name}`}
                </Link>
                <ul className="mt-6 space-y-3">
                  {features.map((f, j) => (
                    <li
                      key={j}
                      className={`flex items-start gap-2 text-sm ${isPro ? 'text-rose-50' : 'text-gray-600'}`}
                    >
                      <span className={isPro ? 'text-white' : 'text-rose-500'}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">{t('pricing.disclaimer')}</p>
      </div>
    </section>
  );
}
