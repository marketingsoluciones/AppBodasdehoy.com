'use client';

import { useState } from 'react';

import { MiniMarkdown } from './MiniMarkdown';

/**
 * ConversationSummary — el resumen que pide el agente para ponerse al día.
 *
 * M4 (16-09): extraído de ConversationHeader. Llega colapsado a dos líneas porque el panel
 * entero se comía el alto del hilo (feedback del owner, 15-09), y se recorta con `clampLines`
 * y no con una clase `line-clamp`, que sobre bloques no recorta nada.
 */
interface ConversationSummaryProps {
  brandColor: string;
  model?: string;
  onClose: () => void;
  summary: string;
}

export function ConversationSummary({
  brandColor,
  model,
  onClose,
  summary,
}: ConversationSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex items-start gap-2 px-4 py-2"
      style={{ backgroundColor: '#F6F4FB', borderTop: '1px solid #EDEDF0' }}
    >
      <span aria-hidden="true" className="mt-0.5 text-sm">
        ✦
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold" style={{ color: brandColor }}>
          Resumen del asistente {model ? `(${model})` : ''}
        </p>
        <MiniMarkdown
          clampLines={expanded ? undefined : 2}
          className="mt-0.5 break-words text-xs"
          style={{ color: '#1C1C22' }}
          text={summary}
        />
        <button
          className="mt-0.5 text-[11px] font-semibold"
          onClick={() => setExpanded((v) => !v)}
          style={{ color: brandColor }}
          type="button"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      </div>
      <button
        aria-label="Cerrar resumen"
        className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
        onClick={onClose}
        style={{ color: '#84848F' }}
        type="button"
      >
        Cerrar
      </button>
    </div>
  );
}
