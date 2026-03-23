import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export default function Footer() {
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
