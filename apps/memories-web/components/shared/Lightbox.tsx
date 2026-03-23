import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useKeyboard } from '../../hooks/useKeyboard';

interface LightboxMedia {
  _id: string;
  originalUrl: string;
  caption?: string;
}

interface LightboxProps {
  media: LightboxMedia[];
  initialIndex: number;
  onClose: () => void;
  watermarkText?: string;
}

export default function Lightbox({ media, initialIndex, onClose, watermarkText }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  const goPrev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(() => setCurrent((c) => Math.min(media.length - 1, c + 1)), [media.length]);

  useKeyboard({ onLeft: goPrev, onRight: goNext, onEscape: onClose });

  // Lock body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const m = media[current];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de fotos, foto ${current + 1} de ${media.length}`}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        aria-label="Cerrar visor de fotos"
      >
        ✕
      </button>
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          aria-label={`Foto anterior (${current} de ${media.length})`}
        >
          ←
        </button>
      )}
      <div className="relative w-[90vw] h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={m?.originalUrl || ''}
          alt={m?.caption ? `Foto: ${m.caption}` : `Foto ${current + 1} de ${media.length}`}
          fill
          sizes="90vw"
          draggable={watermarkText ? false : undefined}
          onContextMenu={watermarkText ? (e) => e.preventDefault() : undefined}
          className="object-contain rounded-lg"
          unoptimized
        />
        {watermarkText && (
          <div
            className="absolute inset-0 pointer-events-none select-none flex items-center justify-center"
            style={{ userSelect: 'none' }}
            aria-hidden="true"
          >
            <span
              className="text-white/40 font-bold text-xl rotate-[-35deg] whitespace-nowrap"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              {watermarkText}
            </span>
          </div>
        )}
      </div>
      {current < media.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 text-white/70 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          aria-label={`Foto siguiente (${current + 2} de ${media.length})`}
        >
          →
        </button>
      )}
      <p className="absolute bottom-4 text-white/50 text-sm" aria-live="polite">
        {current + 1} / {media.length}
        {m?.caption && <span className="ml-3 text-white/70">{m.caption}</span>}
      </p>
    </div>
  );
}
