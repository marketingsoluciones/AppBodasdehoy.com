import { useTranslation } from 'next-i18next';

export default function SocialProof() {
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
