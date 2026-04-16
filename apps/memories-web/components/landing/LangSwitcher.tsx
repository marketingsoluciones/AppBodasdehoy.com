import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const LOCALES: Record<string, string> = {
  es: '🇪🇸 ES',
  en: '🇬🇧 EN',
  pt: '🇧🇷 PT',
  fr: '🇫🇷 FR',
  de: '🇩🇪 DE',
  it: '🇮🇹 IT',
};

export default function LangSwitcher() {
  const router = useRouter();
  const { locale, locales, asPath } = router;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
      >
        {LOCALES[locale || 'es'] || locale?.toUpperCase()}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 min-w-[100px]">
          {(locales || []).map((l) => (
            <Link
              key={l}
              href={asPath}
              locale={l}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-500 transition ${
                l === locale ? 'font-semibold text-rose-500 bg-rose-50' : 'text-gray-700'
              }`}
            >
              {LOCALES[l] || l.toUpperCase()}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
