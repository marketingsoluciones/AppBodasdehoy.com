import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

// ─── Language switcher ─────────────────────────────────────────────────────────

const LOCALES: Record<string, string> = {
  es: '🇪🇸 ES',
  en: '🇬🇧 EN',
  pt: '🇧🇷 PT',
  fr: '🇫🇷 FR',
  de: '🇩🇪 DE',
  it: '🇮🇹 IT',
};

function LangSwitcher() {
  const router = useRouter();
  const { locale, locales, asPath } = router;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
      >
        {LOCALES[locale || 'es'] || locale?.toUpperCase()}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 min-w-[100px]">
          {(locales || []).map((l) => (
            <Link
              key={l}
              href={asPath}
              locale={l}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-500 transition ${
                l === locale ? 'font-semibold text-rose-500 bg-rose-50' : 'text-gray-700'
              }`}
            >
              {LOCALES[l] || l.toUpperCase()}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const { t } = useTranslation('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="text-xl font-bold text-rose-500 tracking-tight">Memories</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#como-funciona" className="hover:text-rose-500 transition">{t('nav.howItWorks')}</a>
          <a href="#funciones" className="hover:text-rose-500 transition">{t('nav.features')}</a>
          <a href="#precios" className="hover:text-rose-500 transition">{t('nav.pricing')}</a>
          <LangSwitcher />
          <Link href="/app" className="text-gray-500 hover:text-gray-900 transition">{t('nav.login')}</Link>
          <Link href="/app" className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-rose-600 transition">
            {t('nav.cta')}
          </Link>
        </nav>

        <button
          className="md:hidden text-gray-500 hover:text-gray-900 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t('nav.menu')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 text-sm font-medium">
          <a href="#como-funciona" className="block text-gray-600 hover:text-rose-500" onClick={() => setMobileOpen(false)}>{t('nav.howItWorks')}</a>
          <a href="#funciones" className="block text-gray-600 hover:text-rose-500" onClick={() => setMobileOpen(false)}>{t('nav.features')}</a>
          <a href="#precios" className="block text-gray-600 hover:text-rose-500" onClick={() => setMobileOpen(false)}>{t('nav.pricing')}</a>
          <div className="flex items-center justify-between">
            <Link href="/app" className="text-gray-600">{t('nav.login')}</Link>
            <LangSwitcher />
          </div>
          <Link href="/app" className="block bg-rose-500 text-white text-center py-2 rounded-full font-semibold">
            {t('nav.cta')}
          </Link>
        </div>
      )}
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

const MOCKUP_PHOTOS = [
  { emoji: '💍', from: 'from-rose-100', to: 'to-pink-100' },
  { emoji: '🎉', from: 'from-orange-100', to: 'to-amber-100' },
  { emoji: '🥂', from: 'from-yellow-100', to: 'to-lime-100' },
  { emoji: '💃', from: 'from-purple-100', to: 'to-violet-100' },
  { emoji: '🎂', from: 'from-blue-100', to: 'to-cyan-100' },
];

function Hero() {
  const { t } = useTranslation('common');
  const raw = t('hero.headline');
  const parts = raw.split(/<rose>|<\/rose>/);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          <span>✨</span> {t('hero.badge')}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 max-w-4xl mx-auto">
          {parts.map((part, i) =>
            i % 2 === 0
              ? <span key={i}>{part}</span>
              : <span key={i} className="text-rose-500">{part}</span>
          )}
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}{' '}
          <strong className="text-gray-700 font-semibold">{t('hero.subtitleStrong')}</strong>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/app" className="w-full sm:w-auto bg-rose-500 text-white px-8 py-4 rounded-full text-base font-bold hover:bg-rose-600 active:scale-95 transition shadow-lg shadow-rose-200">
            {t('hero.ctaPrimary')}
          </Link>
          <a href="#como-funciona" className="w-full sm:w-auto text-gray-600 border border-gray-200 bg-white px-8 py-4 rounded-full text-base font-semibold hover:border-rose-300 hover:text-rose-500 transition">
            {t('hero.ctaSecondary')}
          </a>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="bg-white rounded-3xl shadow-2xl shadow-rose-100 border border-gray-100 overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-2">
              {MOCKUP_PHOTOS.map((p, i) => (
                <div key={i} className={`bg-gradient-to-br ${p.from} ${p.to} rounded-2xl flex items-center justify-center text-4xl ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
                  {p.emoji}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-sm">📷</div>
              <div className="flex-1">
                <div className="h-2 bg-rose-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-rose-500 rounded-full w-3/4 animate-pulse" />
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{t('hero.mockupUploading')}</span>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2">
            <span className="text-green-500 text-lg">✅</span>
            <div>
              <p className="text-xs font-bold text-gray-900">{t('hero.badgePhotos', { count: 12 })}</p>
              <p className="text-[10px] text-gray-400">{t('hero.badgeTime')}</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-xs font-bold text-gray-900">{t('hero.badgeNoApp')}</p>
              <p className="text-[10px] text-gray-400">{t('hero.badgeQR')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social proof strip ────────────────────────────────────────────────────────

function SocialProofStrip() {
  const { t } = useTranslation('common');
  const stats = [
    { value: t('stats.events'), label: t('stats.eventsLabel') },
    { value: t('stats.photos'), label: t('stats.photosLabel') },
    { value: t('stats.rating'), label: t('stats.ratingLabel') },
    { value: t('stats.free'), label: t('stats.freeLabel') },
  ];
  return (
    <section className="border-y border-gray-100 bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const { t } = useTranslation('common');
  const steps = [
    { icon: t('howItWorks.step1Icon'), title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc') },
    { icon: t('howItWorks.step2Icon'), title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc') },
    { icon: t('howItWorks.step3Icon'), title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc') },
  ];
  return (
    <section id="como-funciona" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('howItWorks.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('howItWorks.title')}</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-rose-100 transition">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {i + 1}
              </div>
              <div className="text-5xl mb-5">{step.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────────

function Features() {
  const { t } = useTranslation('common');
  const features = [
    { icon: '📱', title: t('features.noApp'), desc: t('features.noAppDesc') },
    { icon: '📷', title: t('features.quality'), desc: t('features.qualityDesc') },
    { icon: '⚡', title: t('features.realtime'), desc: t('features.realtimeDesc') },
    { icon: '🔒', title: t('features.private'), desc: t('features.privateDesc') },
    { icon: '📦', title: t('features.zip'), desc: t('features.zipDesc') },
    { icon: '🗓️', title: t('features.moments'), desc: t('features.momentsDesc') },
    { icon: '🤖', title: t('features.ai'), desc: t('features.aiDesc') },
    { icon: '📺', title: t('features.slideshow'), desc: t('features.slideshowDesc') },
    { icon: '🎨', title: t('features.qr'), desc: t('features.qrDesc') },
  ];
  return (
    <section id="funciones" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('features.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('features.title')}</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">{t('features.subtitle')}</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group flex gap-4 bg-gray-50 hover:bg-rose-50 rounded-2xl p-5 transition">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:shadow-rose-100 transition">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Use cases ─────────────────────────────────────────────────────────────────

function UseCases() {
  const { t } = useTranslation('common');
  const cases = [
    { emoji: '💍', label: t('useCases.weddings'), desc: t('useCases.weddingsDesc') },
    { emoji: '🎂', label: t('useCases.birthdays'), desc: t('useCases.birthdaysDesc') },
    { emoji: '🏢', label: t('useCases.corporate'), desc: t('useCases.corporateDesc') },
    { emoji: '🎵', label: t('useCases.parties'), desc: t('useCases.partiesDesc') },
    { emoji: '🎉', label: t('useCases.celebrations'), desc: t('useCases.celebrationsDesc') },
  ];
  return (
    <section className="py-24 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('useCases.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('useCases.title')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cases.map((c, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-white hover:shadow-md hover:border-rose-200 transition text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition">{c.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-2">{c.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const { t } = useTranslation('common');
  const testimonials = [
    { text: t('testimonials.t1Text'), name: t('testimonials.t1Name'), role: t('testimonials.t1Role'), avatar: '💍' },
    { text: t('testimonials.t2Text'), name: t('testimonials.t2Name'), role: t('testimonials.t2Role'), avatar: '💼' },
    { text: t('testimonials.t3Text'), name: t('testimonials.t3Name'), role: t('testimonials.t3Role'), avatar: '🎵' },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-3">{t('testimonials.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('testimonials.title')}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-8 flex flex-col gap-4">
              <div className="flex text-rose-400 text-xl">★★★★★</div>
              <p className="text-gray-700 leading-relaxed flex-1">"{item.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-xl">{item.avatar}</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const { t } = useTranslation('common');
  const plans = [
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
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-3xl p-8 border transition ${plan.highlighted ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105' : 'bg-white border-gray-100 shadow-sm'}`}>
              <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className={`text-5xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>€{plan.price}</span>
                <span className={`text-sm mb-2 ${plan.highlighted ? 'text-rose-100' : 'text-gray-400'}`}>/{plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-rose-100' : 'text-gray-500'}`}>{plan.desc}</p>
              <Link href="/app" className={`block text-center w-full py-3 rounded-2xl font-bold text-sm transition ${plan.highlighted ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-rose-500 text-white hover:bg-rose-600'}`}>
                {plan.cta}
              </Link>
              <ul className="mt-6 space-y-3">
                {(Array.isArray(plan.features) ? plan.features : []).map((f, j) => (
                  <li key={j} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-rose-50' : 'text-gray-600'}`}>
                    <span className={plan.highlighted ? 'text-white' : 'text-rose-500'}>✓</span>
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

// ─── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  const { t } = useTranslation('common');
  return (
    <section className="py-24 bg-rose-500">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{t('finalCta.title')}</h2>
        <p className="text-rose-100 text-lg mb-10">{t('finalCta.subtitle')}</p>
        <Link href="/app" className="inline-block bg-white text-rose-500 px-10 py-4 rounded-full text-base font-bold hover:bg-rose-50 active:scale-95 transition shadow-xl">
          {t('finalCta.cta')}
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useTranslation('common');
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📸</span>
              <span className="text-xl font-bold text-white">Memories</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#como-funciona" className="hover:text-white transition">{t('footer.howItWorks')}</a></li>
              <li><a href="#funciones" className="hover:text-white transition">{t('footer.features')}</a></li>
              <li><a href="#precios" className="hover:text-white transition">{t('footer.pricing')}</a></li>
              <li><Link href="/app" className="hover:text-white transition">{t('footer.dashboard')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-white transition">{t('footer.terms')}</a></li>
              <li><a href="#" className="hover:text-white transition">{t('footer.contact')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">{t('footer.instagram')}</a>
            <a href="#" className="hover:text-white transition">{t('footer.twitter')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useTranslation('common');
  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={t('meta.title')} />
        <meta property="og:description" content={t('meta.description')} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>
        <Hero />
        <SocialProofStrip />
        <HowItWorks />
        <Features />
        <UseCases />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'es', ['common'])),
    },
  };
};
