import { ALBUM_TYPE_CONFIG, FALLBACK_GRADIENTS } from '../../constants/albumTypes';

interface AlbumPlaceholderProps {
  name: string;
  mediaCount: number;
  albumType?: string;
}

export default function AlbumPlaceholder({ name, mediaCount, albumType }: AlbumPlaceholderProps) {
  const cfg = albumType ? ALBUM_TYPE_CONFIG[albumType] : undefined;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const [from, to] = cfg
    ? [cfg.from, cfg.to]
    : FALLBACK_GRADIENTS[(name.charCodeAt(0) || 0) % FALLBACK_GRADIENTS.length];

  return (
    <div
      data-testid="album-placeholder"
      className="w-full h-full flex flex-col items-center justify-center gap-1.5"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {cfg ? (
        <span className="drop-shadow-md select-none" style={{ fontSize: '2.5rem' }}>{cfg.icon}</span>
      ) : (
        <span className="text-white font-extrabold drop-shadow-md select-none" style={{ fontSize: '2.75rem', letterSpacing: '0.04em' }}>
          {initials || '♥'}
        </span>
      )}
      {cfg && (
        <span className="text-white/80 text-xs font-semibold tracking-wide uppercase">{cfg.label}</span>
      )}
      {mediaCount === 0 && !cfg && (
        <span className="text-white/60 text-xs font-medium">Sin fotos aún</span>
      )}
    </div>
  );
}
