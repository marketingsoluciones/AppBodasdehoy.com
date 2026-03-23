'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface Message {
  content: string;
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface PageContext {
  development: string;
  path: string;
  referrer: string;
  title: string;
  url: string;
  visitorId: string;
}

/** Minimal markdown to HTML: **bold**, *italic*, [link](url), `code`, and newlines */
function renderMarkdown(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
    .replaceAll(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replaceAll(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline">$1</a>')
    .replaceAll('\n', '<br/>');
}

function TypingIndicator({ dark }: { dark?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
      <div
        style={{
          alignItems: 'center',
          background: dark ? '#374151' : 'white',
          borderRadius: '14px 14px 14px 4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: 4,
          padding: '10px 16px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              animation: `widgetBounce 1.4s ease-in-out ${i * 0.2}s infinite`, background: dark ? '#9ca3af' : '#6b7280', borderRadius: '50%',
              display: 'inline-block',
              height: 6,
              width: 6,
            }}
          />
        ))}
        <style>{`@keyframes widgetBounce { 0%,60%,100% { transform: translateY(0) } 30% { transform: translateY(-4px) } }`}</style>
      </div>
    </div>
  );
}

const QUICK_REPLIES = [
  'Quiero información sobre servicios',
  'Necesito ayuda con mi evento',
  'Ver precios',
];

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const development = (params.development as string) || 'bodasdehoy';
  const visitorId = searchParams.get('visitor') || 'anonymous';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [dark, setDark] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // CSS custom properties for theming
  const theme = dark
    ? { '--accent': '#818cf8', '--accent-bg': '#4f46e5', '--bg': '#111827', '--bg-input': '#1f2937', '--bg-msg': '#1f2937', '--border': '#374151', '--text': '#f9fafb', '--text-secondary': '#9ca3af', '--user-bg': '#4f46e5' }
    : { '--accent': '#6366f1', '--accent-bg': '#6366f1', '--bg': '#f9fafb', '--bg-input': 'white', '--bg-msg': 'white', '--border': '#e5e7eb', '--text': '#1f2937', '--text-secondary': '#6b7280', '--user-bg': '#6366f1' };

  // Listen for page context from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'bodas-widget') return;
      if (event.data.type === 'WIDGET_PAGE_CONTEXT') {
        setPageContext(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ source: 'bodas-widget-iframe', type: 'WIDGET_READY' }, '*');
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([{
      content: 'Hola! En qué puedo ayudarte?', id: 'welcome',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || sending) return;

    const userMsg: Message = {
      content: msgText, id: `u_${Date.now()}`,
      role: 'user', timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setShowQuickReplies(false);

    const typingTimer = setTimeout(() => setShowTyping(true), 400);

    try {
      const res = await fetch('/api/widget-chat', {
        body: JSON.stringify({
          development, pageContext: pageContext ? { path: pageContext.path, title: pageContext.title, url: pageContext.url } : undefined, text: msgText,
          visitorId,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, {
          content: data.reply, id: `a_${Date.now()}`,
          role: 'assistant', timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        content: 'Lo siento, hubo un error. Intenta de nuevo.', id: `err_${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      clearTimeout(typingTimer);
      setShowTyping(false);
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, development, visitorId, pageContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', height: '100vh', ...theme as any }}>
      {/* Header */}
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Asistente</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{pageContext?.title || 'En línea'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6,
              color: 'white', cursor: 'pointer', fontSize: 12, padding: '4px 8px',
            }}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => window.parent.postMessage({ source: 'bodas-widget-iframe', type: 'WIDGET_CLOSE' }, '*')}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6,
              color: 'white', cursor: 'pointer', fontSize: 14, padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ background: 'var(--bg)', flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                background: msg.role === 'user' ? 'var(--user-bg)' : 'var(--bg-msg)',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                fontSize: 13,
                lineHeight: 1.4, maxWidth: '80%',
                padding: '8px 12px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {msg.role === 'assistant' ? (
                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              ) : msg.content}
            </div>
          </div>
        ))}

        {/* Quick Replies */}
        {showQuickReplies && messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, marginTop: 4 }}>
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                style={{
                  background: dark ? '#374151' : 'white',
                  border: `1px solid ${dark ? '#4b5563' : '#d1d5db'}`,
                  borderRadius: 16,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 12, padding: '6px 12px',
                  transition: 'background 0.2s',
                }}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {showTyping && <TypingIndicator dark={dark} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          alignItems: 'flex-end',
          background: 'var(--bg-input)',
          borderTop: `1px solid var(--border)`,
          display: 'flex', gap: 8, padding: '8px 12px',
        }}
      >
        <textarea
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          ref={inputRef}
          rows={1}
          style={{
            border: `1px solid var(--border)`,
            background: dark ? '#1f2937' : 'white',
            borderRadius: 10,
            color: 'var(--text)',
            flex: 1, fontFamily: 'inherit', fontSize: 13,
            maxHeight: 80, outline: 'none',
            padding: '8px 12px',
            resize: 'none',
          }}
          value={input}
        />
        <button
          disabled={!input.trim() || sending}
          onClick={() => sendMessage()}
          style={{
            alignItems: 'center',
            background: input.trim() ? 'var(--accent-bg)' : 'var(--border)', border: 'none',
            borderRadius: 10, color: 'white',
            cursor: input.trim() ? 'pointer' : 'default', display: 'flex', flexShrink: 0,
            fontSize: 16, height: 36, justifyContent: 'center',
            width: 36,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
