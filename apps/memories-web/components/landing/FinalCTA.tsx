import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export default function FinalCTA() {
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
