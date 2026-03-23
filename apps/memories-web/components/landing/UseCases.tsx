import { useTranslation } from 'next-i18next';

export default function UseCases() {
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
