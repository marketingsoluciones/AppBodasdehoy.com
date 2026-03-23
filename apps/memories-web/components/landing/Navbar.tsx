import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import LangSwitcher from './LangSwitcher';

export default function Navbar() {
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
