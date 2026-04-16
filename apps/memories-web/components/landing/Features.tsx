import { useTranslation } from 'next-i18next';

export default function Features() {
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
