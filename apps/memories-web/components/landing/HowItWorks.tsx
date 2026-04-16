import { useTranslation } from 'next-i18next';

export default function HowItWorks() {
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
