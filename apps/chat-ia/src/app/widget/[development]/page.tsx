'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { canVisitorSendMessage, incrementVisitorMessageCount } from '@/utils/visitorLimit';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface LeadData {
  email: string;
  name: string;
  phone: string;
}

type Phase = 'form' | 'chat';

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
    .replaceAll(/_(.+?)_/g, '<em>$1</em>')
    .replaceAll(
      /`(.+?)`/g,
      '<code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>',
    )
    .replaceAll(
      /\[([^\]]+)]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" style="color:#be185d;text-decoration:underline">$1</a>',
    )
    .replaceAll('\n---\n', '<hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"/>')
    .replaceAll('\n', '<br/>');
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
      <div
        style={{
          alignItems: 'center', background: 'white',
          borderRadius: '16px 16px 16px 4px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex', gap: 5, padding: '10px 16px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.18}s infinite`,
              background: 'linear-gradient(135deg,#f43f5e,#a855f7)',
              borderRadius: '50%', display: 'inline-block', height: 7, width: 7,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ─── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  { emoji: '💒', text: 'Ver opciones para mi boda' },
  { emoji: '💰', text: 'Quiero saber los precios' },
  { emoji: '📅', text: 'Consultar disponibilidad' },
  { emoji: '📸', text: 'Ver fotos y espacios' },
];

// ─── Lead form ────────────────────────────────────────────────────────────────

function LeadForm({ onSubmit }: { onSubmit: (data: LeadData) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Por favor, escribe tu nombre'); return; }
    if (!phone.trim() && !email.trim()) { setError('Añade tu teléfono o email para poder contactarte'); return; }
    setError('');
    onSubmit({ email: email.trim(), name: name.trim(), phone: phone.trim() });
  };

  const inputBase: React.CSSProperties = {
    background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
    boxSizing: 'border-box', color: '#1f2937', fontFamily: 'inherit',
    fontSize: 14, outline: 'none', padding: '10px 14px',
    transition: 'border-color 0.15s', width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', height: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(140deg,#f43f5e 0%,#a855f7 100%)', flexShrink: 0, overflow: 'hidden', padding: '20px 20px 52px', position: 'relative' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', height: 160, pointerEvents: 'none', position: 'absolute', right: -40, top: -40, width: 160 }} />
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '50%', bottom: 10, height: 100, left: 20, pointerEvents: 'none', position: 'absolute', width: 100 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', display: 'flex', fontSize: 26, height: 52, justifyContent: 'center', marginBottom: 10, width: 52 }}>
            💒
          </div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Asistente de bodas</div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 5 }}>
            <span style={{ background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 0 2px rgba(74,222,128,0.3)', display: 'inline-block', height: 7, width: 7 }} />
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>En línea · responde enseguida</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#f8f7ff', display: 'flex', flex: 1, flexDirection: 'column' }}>
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', margin: '-26px 16px 0', padding: '24px 20px', position: 'relative' }}>
          <p style={{ color: '#1f2937', fontSize: 17, fontWeight: 700, lineHeight: 1.3, margin: '0 0 6px' }}>
            ¡Hola! 👋 Encantados de ayudarte
          </p>
          <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
            Cuéntanos un poco sobre ti para personalizar tu experiencia.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Tu nombre *', placeholder: 'María García', ref: nameRef, setter: setName, type: 'text', value: name },
              { label: 'Teléfono', placeholder: '+34 600 000 000', ref: undefined, setter: setPhone, type: 'tel', value: phone },
              { label: 'Email', placeholder: 'maria@ejemplo.com', ref: undefined, setter: setEmail, type: 'email', value: email },
            ].map(({ label, placeholder, ref, setter, type, value }) => (
              <div key={label}>
                <label style={{ color: '#374151', display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'; }}
                  onChange={(e) => setter(e.target.value)}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#a855f7'; }}
                  placeholder={placeholder}
                  ref={ref as any}
                  style={inputBase}
                  type={type}
                  value={value}
                />
              </div>
            ))}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: 12, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <button
              onMouseEnter={(e) => { (e.currentTarget).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.opacity = '1'; }}
              style={{
                background: 'linear-gradient(140deg,#f43f5e 0%,#a855f7 100%)',
                border: 'none', borderRadius: 12, boxShadow: '0 4px 16px rgba(168,85,247,0.35)',
                color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                fontWeight: 700, marginTop: 4, padding: '12px 20px', transition: 'opacity 0.2s',
              }}
              type="submit"
            >
              Comenzar conversación ✨
            </button>

            <button
              onClick={() => onSubmit({ email: '', name: 'Visitante', phone: '' })}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 4, textDecoration: 'underline' }}
              type="button"
            >
              Continuar sin registrarme
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#f8f7ff', flexShrink: 0, padding: '10px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 11 }}>
          <span style={{ color: '#9ca3af' }}>Powered by </span>
          <span style={{ color: '#be185d', fontWeight: 700 }}>Bodas de Hoy</span>
          <span style={{ color: '#9ca3af' }}> ❤️</span>
        </span>
      </div>
    </div>
  );
}

// ─── Chat view ────────────────────────────────────────────────────────────────

function ChatView({
  development,
  leadData,
  msgsKey,
  pageContext,
  visitorId,
}: {
  development: string;
  leadData: LeadData;
  msgsKey: string;
  pageContext: PageContext | null;
  visitorId: string;
}) {
  const isGuest = leadData.name === 'Visitante';

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(msgsKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    // No saved messages — start with welcome
    const greeting = isGuest
      ? '¡Hola! 👋 Soy tu asistente de bodas. ¿En qué puedo ayudarte hoy?'
      : `¡Hola, **${leadData.name}**! 👋 Estoy aquí para ayudarte a organizar el día perfecto. ¿Por dónde empezamos?`;
    return [{ content: greeting, id: 'welcome', role: 'assistant', timestamp: new Date().toISOString() }];
  });

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(() => {
    try {
      const saved = localStorage.getItem(msgsKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 1) return false;
      }
    } catch { /* ignore */ }
    return true;
  });
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try { localStorage.setItem(msgsKey, JSON.stringify(messages)); }
    catch { /* ignore */ }
  }, [messages, msgsKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || sending) return;

    // Client-side rate limit check
    if (!canVisitorSendMessage()) {
      setLimitReached(true);
      return;
    }

    setMessages((prev) => [...prev, { content: msgText, id: `u_${Date.now()}`, role: 'user', timestamp: new Date().toISOString() }]);
    setInput('');
    setSending(true);
    setShowQuickReplies(false);

    const timer = setTimeout(() => setShowTyping(true), 380);

    try {
      const res = await fetch('/api/widget-chat', {
        body: JSON.stringify({
          development,
          leadData: { email: leadData.email, name: leadData.name, phone: leadData.phone },
          pageContext: pageContext ? { path: pageContext.path, title: pageContext.title, url: pageContext.url } : undefined,
          text: msgText,
          visitorId,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      // Handle server-side rate limit
      if (res.status === 429) {
        setLimitReached(true);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Increment client-side counter on success
      incrementVisitorMessageCount();

      if (data.reply) {
        // Add demo disclaimer if response is from local fallback
        const replyContent = data.source === 'local-demo'
          ? data.reply + '\n\n---\n_Respuesta automática. Un asesor te contactará pronto._'
          : data.reply;
        setMessages((prev) => [...prev, { content: replyContent, id: `a_${Date.now()}`, role: 'assistant', timestamp: new Date().toISOString() }]);
        window.parent.postMessage({ count: 1, source: 'bodas-widget-iframe', type: 'WIDGET_UNREAD' }, '*');
      }

      // Check if limit reached after this message
      if (!canVisitorSendMessage()) {
        setLimitReached(true);
      }
    } catch {
      setMessages((prev) => [...prev, { content: 'Lo siento, ha habido un problema. Inténtalo de nuevo.', id: `err_${Date.now()}`, role: 'assistant', timestamp: new Date().toISOString() }]);
    } finally {
      clearTimeout(timer);
      setShowTyping(false);
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, development, visitorId, pageContext, leadData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const canSend = input.trim() && !sending;

  return (
    <div style={{ background: '#f8f7ff', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,-apple-system,sans-serif', height: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ alignItems: 'center', background: 'linear-gradient(140deg,#f43f5e 0%,#a855f7 100%)', display: 'flex', flexShrink: 0, gap: 12, overflow: 'hidden', padding: '14px 16px', position: 'relative' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', height: 100, pointerEvents: 'none', position: 'absolute', right: -20, top: -30, width: 100 }} />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', display: 'flex', flexShrink: 0, fontSize: 20, height: 40, justifyContent: 'center', width: 40 }}>
          💒
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Asistente de bodas</div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 4, marginTop: 2 }}>
            <span style={{ background: '#4ade80', borderRadius: '50%', display: 'inline-block', height: 6, width: 6 }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>En línea</span>
          </div>
        </div>
        <button
          onClick={() => window.parent.postMessage({ source: 'bodas-widget-iframe', type: 'WIDGET_CLOSE' }, '*')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', flexShrink: 0, fontSize: 14, padding: '5px 9px' }}
        >
          ✕
        </button>
      </div>

      {/* ── Lead pill ── */}
      {!isGuest && leadData.name && (
        <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', flexShrink: 0, padding: '7px 14px' }}>
          <div style={{ alignItems: 'center', color: '#6b7280', display: 'flex', fontSize: 11, gap: 10 }}>
            <span>👤 <strong style={{ color: '#374151' }}>{leadData.name}</strong></span>
            {leadData.phone && <span>📱 {leadData.phone}</span>}
            {leadData.email && <span>✉️ {leadData.email}</span>}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, overflowY: 'auto', padding: '16px 12px 8px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
            <div
              style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : 'white',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(168,85,247,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                color: msg.role === 'user' ? 'white' : '#1f2937',
                fontSize: 13, lineHeight: 1.5, maxWidth: '82%',
                padding: '10px 14px', wordBreak: 'break-word',
              }}
            >
              {msg.role === 'assistant'
                ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                : msg.content}
            </div>
            <span style={{ color: '#9ca3af', fontSize: 10, marginTop: 3, paddingInline: 4 }}>
              {fmtTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* Quick replies */}
        {showQuickReplies && messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, marginTop: 4 }}>
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.text}
                onClick={() => sendMessage(qr.text)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#faf5ff'; e.currentTarget.style.borderColor = '#a855f7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e9d5ff'; }}
                style={{
                  background: 'white', border: '1.5px solid #e9d5ff', borderRadius: 20,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', color: '#7c3aed', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 500, padding: '7px 13px', transition: 'all 0.15s',
                }}
              >
                {qr.emoji} {qr.text}
              </button>
            ))}
          </div>
        )}

        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input / Limit banner ── */}
      {limitReached ? (
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', borderTop: '1px solid #f3f4f6', flexShrink: 0, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ color: '#92400e', fontSize: 13, fontWeight: 600, lineHeight: 1.4, margin: '0 0 8px' }}>
            Has alcanzado el límite de mensajes gratuitos
          </p>
          <a
            href="https://organizador.bodasdehoy.com/login?q=register"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg,#f43f5e,#a855f7)', border: 'none', borderRadius: 10,
              color: 'white', display: 'inline-block', fontSize: 13, fontWeight: 700, padding: '10px 20px',
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}
            target="_blank"
          >
            Crear cuenta gratis para continuar
          </a>
        </div>
      ) : (
        <div style={{ alignItems: 'flex-end', background: 'white', borderTop: '1px solid #f3f4f6', display: 'flex', flexShrink: 0, gap: 8, padding: '10px 12px' }}>
          <textarea
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            onChange={(e) => setInput(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            ref={inputRef}
            rows={1}
            style={{
              background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: 12, boxSizing: 'border-box',
              color: '#1f2937', flex: 1, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
              maxHeight: 80, outline: 'none', padding: '9px 14px', resize: 'none', transition: 'border-color 0.15s',
            }}
            value={input}
          />
          <button
            disabled={!canSend}
            onClick={() => sendMessage()}
            style={{
              alignItems: 'center', background: canSend ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb',
              border: 'none', borderRadius: 12, boxShadow: canSend ? '0 2px 8px rgba(168,85,247,0.35)' : 'none',
              color: canSend ? 'white' : '#9ca3af', cursor: canSend ? 'pointer' : 'default',
              display: 'flex', flexShrink: 0, height: 38, justifyContent: 'center', transition: 'all 0.2s', width: 38,
            }}
          >
            {sending
              ? <span style={{ animation: 'spin 0.8s linear infinite', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', borderTopColor: 'white', display: 'inline-block', height: 14, width: 14 }} />
              : (
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
                  <path d="m22 2-11 11M22 2 15 22 11 13 2 9l20-7z" />
                </svg>
              )}
          </button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Footer ── */}
      <div style={{ background: 'white', borderTop: '1px solid #f3f4f6', flexShrink: 0, padding: '6px 12px', textAlign: 'center' }}>
        <span style={{ color: '#9ca3af', fontSize: 10 }}>Powered by </span>
        <span style={{ color: '#be185d', fontSize: 10, fontWeight: 700 }}>Bodas de Hoy</span>
        <span style={{ color: '#9ca3af', fontSize: 10 }}> ❤️</span>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const LEAD_KEY_PFX = 'bodas_lead_';
const PHASE_KEY_PFX = 'bodas_phase_';
const MSGS_KEY_PFX = 'bodas_msgs_';

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const development = (params.development as string) || 'bodasdehoy';
  const visitorId = searchParams.get('visitor') || 'anonymous';

  const leadKey = LEAD_KEY_PFX + visitorId;
  const phaseKey = PHASE_KEY_PFX + visitorId;
  const msgsKey = MSGS_KEY_PFX + visitorId;

  const [phase, setPhase] = useState<Phase>(() => {
    try { return (localStorage.getItem(phaseKey) === 'chat') ? 'chat' : 'form'; }
    catch { return 'form'; }
  });

  const [leadData, setLeadData] = useState<LeadData>(() => {
    try {
      const saved = localStorage.getItem(leadKey);
      return saved ? JSON.parse(saved) : { email: '', name: '', phone: '' };
    } catch { return { email: '', name: '', phone: '' }; }
  });

  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'bodas-widget') return;
      if (event.data.type === 'WIDGET_PAGE_CONTEXT') setPageContext(event.data.payload);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ source: 'bodas-widget-iframe', type: 'WIDGET_READY' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleLeadSubmit = useCallback((data: LeadData) => {
    setLeadData(data);
    setPhase('chat');
    try {
      localStorage.setItem(leadKey, JSON.stringify(data));
      localStorage.setItem(phaseKey, 'chat');
    } catch { /* ignore */ }
  }, [leadKey, phaseKey]);

  if (phase === 'form') {
    return <LeadForm onSubmit={handleLeadSubmit} />;
  }

  return (
    <ChatView
      development={development}
      leadData={leadData}
      msgsKey={msgsKey}
      pageContext={pageContext}
      visitorId={visitorId}
    />
  );
}
