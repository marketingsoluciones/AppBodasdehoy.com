'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PageContext {
  url: string;
  path: string;
  title: string;
  referrer: string;
  development: string;
  visitorId: string;
}

/** Minimal markdown → HTML: **bold**, *italic*, [link](url), `code`, and newlines */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#6366f1;text-decoration:underline">$1</a>')
    .replace(/\n/g, '<br/>');
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '14px 14px 14px 4px',
          background: 'white',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#9ca3af',
              display: 'inline-block',
              animation: `widgetBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <style>{`@keyframes widgetBounce { 0%,60%,100% { transform: translateY(0) } 30% { transform: translateY(-4px) } }`}</style>
      </div>
    </div>
  );
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Listen for page context from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'bodas-widget') return;
      if (event.data.type === 'WIDGET_PAGE_CONTEXT') {
        setPageContext(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);

    // Notify parent we're ready
    window.parent.postMessage({ type: 'WIDGET_READY', source: 'bodas-widget-iframe' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hola! En qué puedo ayudarte?',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Show typing indicator after a brief natural delay
    const typingTimer = setTimeout(() => setShowTyping(true), 400);

    try {
      const res = await fetch('/api/widget-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          development,
          visitorId,
          text,
          pageContext: pageContext
            ? { url: pageContext.url, path: pageContext.path, title: pageContext.title }
            : undefined,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, hubo un error. Intenta de nuevo.',
          timestamp: new Date().toISOString(),
        },
      ]);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Asistente</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {pageContext?.title || 'En línea'}
          </div>
        </div>
        <button
          onClick={() => window.parent.postMessage({ type: 'WIDGET_CLOSE', source: 'bodas-widget-iframe' }, '*')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
            fontSize: 14,
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px 4px',
          background: '#f9fafb',
        }}
      >
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
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? '#6366f1' : 'white',
                color: msg.role === 'user' ? 'white' : '#1f2937',
                fontSize: 13,
                lineHeight: 1.4,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.role === 'assistant' ? (
                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          rows={1}
          style={{
            flex: 1,
            border: '1px solid #d1d5db',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            maxHeight: 80,
          }}
          value={input}
        />
        <button
          disabled={!input.trim() || sending}
          onClick={sendMessage}
          style={{
            background: input.trim() ? '#6366f1' : '#d1d5db',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            cursor: input.trim() ? 'pointer' : 'default',
            fontSize: 16,
            height: 36,
            width: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
