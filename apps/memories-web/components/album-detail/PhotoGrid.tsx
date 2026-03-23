import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Grid, type CellComponentProps } from 'react-window';
import type { AlbumMedia } from '@bodasdehoy/memories';

const VIRTUALIZE_THRESHOLD = 60;
const GAP = 6; // ~gap-1.5

interface PhotoGridProps {
  media: AlbumMedia[];
  onClickPhoto: (i: number) => void;
  onSetCover: (m: AlbumMedia) => void;
}

/* ── Single photo cell (shared by both modes) ── */
function PhotoCell({
  media: m,
  index,
  onClickPhoto,
  onSetCover,
  size,
}: {
  media: AlbumMedia;
  index: number;
  onClickPhoto: (i: number) => void;
  onSetCover: (m: AlbumMedia) => void;
  size?: number;
}) {
  return (
    <button
      data-testid="photo-item"
      onClick={() => onClickPhoto(index)}
      className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl group"
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src={m.thumbnailUrl || m.originalUrl}
        alt={m.caption || `Foto ${index + 1}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        className="object-cover group-hover:scale-105 transition duration-300"
      />
      {m.mediaType === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-2">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-end justify-center pb-2">
        <span
          role="button"
          data-testid="btn-set-cover"
          onClick={(e) => { e.stopPropagation(); onSetCover(m); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-gray-800 text-xs px-3 py-1 rounded-full font-medium shadow"
        >
          Usar como portada
        </span>
      </div>
    </button>
  );
}

/* ── Simple grid (small collections) ── */
function SimpleGrid({ media, onClickPhoto, onSetCover }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
      {media.map((m, i) => (
        <PhotoCell key={m._id} media={m} index={i} onClickPhoto={onClickPhoto} onSetCover={onSetCover} />
      ))}
    </div>
  );
}

/* ── Virtualized grid (large collections, react-window v2) ── */

interface VirtualCellProps {
  media: AlbumMedia[];
  cols: number;
  cellSize: number;
  onClickPhoto: (i: number) => void;
  onSetCover: (m: AlbumMedia) => void;
}

function VirtualCell({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  media,
  cols,
  cellSize,
  onClickPhoto,
  onSetCover,
}: CellComponentProps<VirtualCellProps>) {
  const idx = rowIndex * cols + columnIndex;
  if (idx >= media.length) return null;
  return (
    <div {...ariaAttributes} style={{ ...style, paddingRight: columnIndex < cols - 1 ? GAP : 0, paddingBottom: GAP }}>
      <PhotoCell media={media[idx]} index={idx} onClickPhoto={onClickPhoto} onSetCover={onSetCover} size={cellSize} />
    </div>
  );
}

function VirtualGrid({ media, onClickPhoto, onSetCover }: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = width >= 768 ? 4 : width >= 640 ? 3 : 2;
  const cellSize = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  const rowCount = Math.ceil(media.length / cols);

  const cellProps = React.useMemo<VirtualCellProps>(
    () => ({ media, cols, cellSize, onClickPhoto, onSetCover }),
    [media, cols, cellSize, onClickPhoto, onSetCover],
  );

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && cellSize > 0 && (
        <Grid
          cellComponent={VirtualCell}
          cellProps={cellProps}
          columnCount={cols}
          columnWidth={cellSize + GAP}
          rowCount={rowCount}
          rowHeight={cellSize + GAP}
          defaultHeight={Math.min(rowCount * (cellSize + GAP), 800)}
          defaultWidth={width}
          style={{ width, height: Math.min(rowCount * (cellSize + GAP), 800), overflowX: 'hidden' }}
        />
      )}
    </div>
  );
}

/* ── Exported component ── */
export const PhotoGrid = React.memo(function PhotoGrid(props: PhotoGridProps) {
  if (props.media.length === 0) return null;
  if (props.media.length > VIRTUALIZE_THRESHOLD) return <VirtualGrid {...props} />;
  return <SimpleGrid {...props} />;
});
