import { useTranslation } from 'next-i18next';

export default function Testimonials() {
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
