import { useTranslation } from 'next-i18next';

// Imágenes locales en /public/hero/1..6.jpg.
// Cambio del README original (trae.ai → local): el endpoint coreva-normal.trae.ai
// es un servicio AI de ByteDance/TikTok sin TOS público — no apto para producción.
// El README explícitamente pedía descargar las 6 a /public/hero. Hecho.
const PHOTOS = [
  {
    col: '1',
    guest: 'Carlos',
    initial: 'C',
    momentKey: 'momentCouple',
    position: 'center 32%',
    row: '1 / span 2',
    src: '/hero/1.jpg',
    fresh: true,
  },
  {
    col: '2 / span 2',
    guest: 'Ana',
    initial: 'A',
    momentKey: 'momentToast',
    position: 'center',
    row: '1',
    src: '/hero/2.jpg',
  },
  {
    col: '2',
    guest: 'Diego',
    initial: 'D',
    momentKey: 'momentJustMarried',
    position: 'center 26%',
    row: '2',
    src: '/hero/3.jpg',
  },
  {
    col: '3',
    guest: 'Lucia',
    initial: 'L',
    momentKey: 'momentCake',
    position: 'center',
    row: '2',
    src: '/hero/4.jpg',
  },
  {
    col: '1',
    guest: 'Pablo',
    initial: 'P',
    momentKey: 'momentDetails',
    position: 'center',
    row: '3',
    src: '/hero/5.jpg',
  },
  {
    col: '2 / span 2',
    guest: 'Marta',
    initial: 'M',
    momentKey: 'momentParty',
    position: 'center 60%',
    row: '3',
    src: '/hero/6.jpg',
    fresh: true,
  },
];

export default function HeroAlbum() {
  const { t } = useTranslation('common');

  return (
    <div className="memories-hero-album relative mx-auto w-full max-w-[620px]">
      <style jsx>{`
        .memories-hero-album {
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        .mem-grid {
          display: grid;
          gap: 10px;
          grid-auto-rows: 92px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .mem-dot {
          animation: mem-pulse 1.7s ease-in-out infinite;
        }

        .mem-float {
          animation: mem-float 6s ease-in-out infinite;
        }

        .mem-float-alt {
          animation: mem-float-alt 7s ease-in-out infinite;
        }

        .mem-bar-fill {
          animation: mem-fill 3.2s ease-in-out infinite alternate;
        }

        @keyframes mem-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(0.84);
          }
        }

        @keyframes mem-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes mem-float-alt {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(7px);
          }
        }

        @keyframes mem-fill {
          0% {
            width: 18%;
          }
          100% {
            width: 84%;
          }
        }

        @media (max-width: 640px) {
          .mem-grid {
            gap: 8px;
            grid-auto-rows: 86px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .mem-grid :global(.mem-span-wide) {
            grid-column: auto !important;
          }

          .mem-grid :global(.mem-span-tall) {
            grid-row: span 1 !important;
          }

          .mem-floating {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mem-dot,
          .mem-float,
          .mem-float-alt,
          .mem-bar-fill {
            animation: none !important;
          }

          .mem-bar-fill {
            width: 84% !important;
          }
        }
      `}</style>

      <div className="mem-floating mem-float absolute -right-6 top-7 z-10 hidden items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_24px_52px_-28px_rgba(20,20,40,0.45)] md:flex">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-200 via-fuchsia-200 to-violet-400 text-sm font-extrabold text-white">
          M
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-bold text-gray-900">
            {t('hero.album.uploadNoticeTitle', { defaultValue: 'María subió 4 fotos' })}
          </div>
          <div className="text-[11px] font-semibold text-gray-400">
            {t('hero.album.uploadNoticeTime', { defaultValue: 'hace unos segundos' })}
          </div>
        </div>
      </div>

      <div className="mem-floating mem-float-alt absolute -bottom-5 -left-7 z-10 hidden items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_24px_52px_-28px_rgba(20,20,40,0.45)] md:flex">
        <div className="relative h-12 w-12 rounded-xl bg-gray-950 p-2">
          <span className="absolute left-2 top-2 h-3.5 w-3.5 rounded-[4px] border-[3px] border-white" />
          <span className="absolute right-2 top-2 h-3.5 w-3.5 rounded-[4px] border-[3px] border-white" />
          <span className="absolute bottom-2 left-2 h-3.5 w-3.5 rounded-[4px] border-[3px] border-white" />
          <span className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 rounded-[3px] bg-rose-500" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-extrabold text-gray-900">
            {t('hero.album.qrTitle', { defaultValue: 'Escanea el QR' })}
          </div>
          <div className="text-[11px] font-semibold text-gray-400">
            {t('hero.album.qrSubtitle', { defaultValue: 'para subir tus fotos' })}
          </div>
        </div>
      </div>

      <div className="relative z-[1] rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_40px_80px_-32px_rgba(40,20,40,0.32)]">
        <div className="flex items-center gap-3 px-1 pb-4 pt-1">
          <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 via-rose-400 to-rose-600 text-sm font-extrabold tracking-tight text-white">
            L&amp;M
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-extrabold text-gray-900">
              {t('hero.album.title', { defaultValue: 'Boda de Laura & Marcos' })}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] font-semibold text-gray-400">
              <span className="mem-dot inline-block h-2 w-2 rounded-full bg-rose-500" />
              <span>
                {t('hero.album.liveLabel', { defaultValue: 'En directo' })} ·{' '}
                {t('hero.album.liveCount', { defaultValue: '247 fotos' })}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            {[
              { bg: 'from-amber-300 to-orange-400', text: 'A' },
              { bg: 'from-emerald-300 to-green-500', text: 'J' },
              { bg: 'from-indigo-300 to-blue-500', text: '+32' },
            ].map((avatar, index) => (
              <span
                className={`-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${avatar.bg} text-[11px] font-extrabold text-white first:ml-0`}
                key={avatar.text + index}
              >
                {avatar.text}
              </span>
            ))}
          </div>
        </div>

        <div className="mem-grid">
          {PHOTOS.map((photo, idx) => {
            const moment = t(`hero.album.${photo.momentKey}`, { defaultValue: photo.momentKey });
            return (
            <div
              className={`relative overflow-hidden rounded-2xl bg-rose-50 ${photo.col.includes('span 2') ? 'mem-span-wide' : ''} ${photo.row.includes('span 2') ? 'mem-span-tall' : ''}`}
              key={photo.src}
              style={{ gridColumn: photo.col, gridRow: photo.row }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${moment} – foto de ${photo.guest}`}
                className="h-full w-full object-cover"
                decoding="async"
                loading={idx === 0 ? 'eager' : 'lazy'}
                src={photo.src}
                style={{ objectPosition: photo.position }}
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                {moment}
              </span>
              {photo.fresh && (
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[9.5px] font-extrabold text-rose-500">
                  <span className="mem-dot inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {t('hero.album.fresh', { defaultValue: 'recién subida' })}
                </span>
              )}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/90 text-[9px] font-extrabold text-gray-700">
                  {photo.initial}
                </span>
                <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                  {photo.guest}
                </span>
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
          <span className="text-lg">📸</span>
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-bold text-gray-900">
                {t('hero.album.progressLabel', {
                  defaultValue: 'Subiendo 4 fotos nuevas…',
                })}
              </span>
              <span className="text-[11.5px] font-extrabold text-rose-500">84%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-rose-100">
              <div className="mem-bar-fill h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
