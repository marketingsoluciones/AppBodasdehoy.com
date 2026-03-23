import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const MOCKUP_PHOTOS = [
  { emoji: '💍', from: 'from-rose-100', to: 'to-pink-100' },
  { emoji: '🎉', from: 'from-orange-100', to: 'to-amber-100' },
  { emoji: '🥂', from: 'from-yellow-100', to: 'to-lime-100' },
  { emoji: '💃', from: 'from-purple-100', to: 'to-violet-100' },
  { emoji: '🎂', from: 'from-blue-100', to: 'to-cyan-100' },
];

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
