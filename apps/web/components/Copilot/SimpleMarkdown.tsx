/**
 * SimpleMarkdown - Lightweight markdown renderer (no dependencies)
 *
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```,
 * [links](url), - lists, numbered lists, line breaks
 */

import { memo } from 'react';

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: '#1e1e2e',
  color: '#cdd6f4',
  padding: '10px 12px',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  margin: '6px 0',
};

const inlineCodeStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#e11d48',
  padding: '1px 5px',
  borderRadius: '3px',
  fontFamily: 'monospace',
  fontSize: '0.9em',
};

/** Parse inline markdown (bold, italic, code, links) */
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Pattern: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      nodes.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      nodes.push(<code key={match.index} style={inlineCodeStyle}>{match[4]}</code>);
    } else if (match[5] && match[6]) {
      nodes.push(
        <a key={match.index} href={match[6]} target="_blank" rel="noopener noreferrer" style={{ color: '#F7628C', textDecoration: 'underline' }}>
          {match[5]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

const SimpleMarkdown = memo(({ content }: { content: string }) => {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  // Split code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  parts.forEach((part, pi) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newline = inner.indexOf('\n');
      const code = newline >= 0 ? inner.slice(newline + 1) : inner;
      elements.push(<pre key={`cb-${pi}`} style={codeBlockStyle}>{code}</pre>);
      return;
    }

    const lines = part.split('\n');
    lines.forEach((line, li) => {
      const trimmed = line.trim();
      if (!trimmed && li > 0) {
        elements.push(<br key={`br-${pi}-${li}`} />);
        return;
      }
      // Unordered list
      if (/^[-•]\s/.test(trimmed)) {
        elements.push(
          <div key={`ul-${pi}-${li}`} style={{ paddingLeft: '16px', display: 'flex', gap: '6px' }}>
            <span>•</span><span>{parseInline(trimmed.slice(2))}</span>
          </div>
        );
        return;
      }
      // Ordered list
      const olMatch = trimmed.match(/^(\d+)[.)]\s(.*)/);
      if (olMatch) {
        elements.push(
          <div key={`ol-${pi}-${li}`} style={{ paddingLeft: '16px', display: 'flex', gap: '6px' }}>
            <span>{olMatch[1]}.</span><span>{parseInline(olMatch[2])}</span>
          </div>
        );
        return;
      }
      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(<div key={`h3-${pi}-${li}`} style={{ fontWeight: 600, fontSize: '14px', margin: '6px 0 2px' }}>{parseInline(trimmed.slice(4))}</div>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(<div key={`h2-${pi}-${li}`} style={{ fontWeight: 700, fontSize: '15px', margin: '8px 0 2px' }}>{parseInline(trimmed.slice(3))}</div>);
        return;
      }
      // Regular paragraph
      if (trimmed) {
        elements.push(<span key={`p-${pi}-${li}`}>{parseInline(trimmed)} </span>);
      }
    });
  });

  return <>{elements}</>;
});

SimpleMarkdown.displayName = 'SimpleMarkdown';

export default SimpleMarkdown;
