import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import HeroAlbum from './HeroAlbum';

export default function Hero() {
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
          <HeroAlbum />
        </div>
      </div>
    </section>
  );
}
