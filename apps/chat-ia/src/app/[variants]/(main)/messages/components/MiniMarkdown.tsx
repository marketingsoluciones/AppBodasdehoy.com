'use client';

/**
 * MiniMarkdown — renderizado ligero y SEGURO (sin dangerouslySetInnerHTML)
 * para el subset de Markdown que genera la IA en borradores y mensajes:
 * **negrita**, *cursiva*, `código`, listas con - o *, listas
 * numeradas y párrafos/saltos de línea.
 *
 * Auditoría QA 14-09 (N28): los paneles "Borrador del asistente" y los
 * mensajes enviados por IA mostraban el Markdown crudo (se veían los **
 * literales). Se renderiza como React elements, imposibilitando XSS.
 */

import { Fragment, type ReactNode } from 'react';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Orden: código primero (no se toca su interior), luego negrita, luego cursiva
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-i${i++}`;
    if (m[1]) {
      out.push(
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(
        <strong key={key} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MiniMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let paragraph: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, idx) => (
      <li key={idx}>{renderInline(it, `l${key}-${idx}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} className="ml-4 list-decimal space-y-0.5">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="ml-4 list-disc space-y-0.5">
          {items}
        </ul>
      ),
    );
    list = null;
  };
  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const joined = paragraph.join(' ');
    blocks.push(
      <p key={key++} className="min-h-[1em]">
        {renderInline(joined, `p${key}`)}
      </p>,
    );
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
    } else if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();

  return (
    <div className={className ?? 'whitespace-pre-wrap break-words text-sm'}>
      {blocks.map((b, idx) => (
        <Fragment key={idx}>{b}</Fragment>
      ))}
    </div>
  );
}
