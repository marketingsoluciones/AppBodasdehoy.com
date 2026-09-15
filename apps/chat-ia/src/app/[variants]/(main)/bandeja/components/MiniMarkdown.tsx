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
  // Los lookarounds evitan enfasis intrapalabra: 2*3*4 NO es cursiva,
  // pero *importante* si (borde no alfanumerico).
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|((?<![\w*])\*[^*]+\*(?![\w*]))/g;
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

/**
 * stripMiniMarkdown — el mismo subset que renderiza MiniMarkdown, en texto plano.
 *
 * Auditoria 15-09: el preview de la lista usaba `markdownToTxt` (parser Markdown
 * completo) sobre TODOS los mensajes, incluidos los humanos, y mutilaba texto real:
 * "2*3*4 = 24" salia "234 = 24" y "_hola_" perdia los guiones bajos. Estas reglas
 * son las de renderInline (con los mismos lookarounds), asi que lo que el hilo
 * renderiza como enfasis es exactamente lo que aqui se limpia. Nada mas.
 */
export function stripMiniMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<![\w*])\*([^*]+)\*(?![\w*])/g, '$1');
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
    // Auditoria 15-09: unir las lineas con ' ' aplastaba los saltos simples, y la IA
    // los usa para estructurar ("Nombre: X\nFecha: Y"). Se conserva cada linea con <br/>.
    const pKey = key++;
    blocks.push(
      <p key={pKey} className="min-h-[1em]">
        {paragraph.map((line, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(line, `p${pKey}-${idx}`)}
          </Fragment>
        ))}
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
