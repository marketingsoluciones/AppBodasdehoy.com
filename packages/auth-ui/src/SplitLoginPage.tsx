import React, { useEffect, useState } from 'react';

/** Si se define, el titular rota por estos tipos de evento (dinámico). Si no, se usa `headline` estático. */
export const DEFAULT_EVENT_TYPES = [
  'boda', 'comunión', 'bautizo', 'fiesta de 16', 'cumpleaños', 'despedida de soltero',
  'aniversario', 'baby shower', 'graduación', 'fiesta de empresa', 'evento corporativo',
  'confirmación', 'inauguración', 'cena de gala', 'fiesta temática',
];

export interface LeftPanelConfig {
  brandName?: string;
  description?: string;
  /** Tipos de evento para titular rotatorio. Si está vacío o no se pasa, se usa `headline` estático. */
  eventTypesForRotation?: string[];
  features?: { icon: string; text: string }[];
  gradient?: string;
  headline?: string;
  logoEmoji?: string;
  stats?: { label: string; value: string }[];
}

export interface SplitLoginPageProps {
  children: React.ReactNode;
  leftPanel?: LeftPanelConfig;
}

const DEFAULT_LEFT_PANEL: Required<Omit<LeftPanelConfig, 'eventTypesForRotation'>> & { eventTypesForRotation?: string[] } = {
  brandName: 'Bodas de Hoy · Copilot IA',
  description:
    'Planifica cada detalle con inteligencia artificial. Invitados, presupuesto, itinerario y mucho más — en un solo lugar.',
  eventTypesForRotation: DEFAULT_EVENT_TYPES,
  features: [
    { icon: '✨', text: 'Asistente IA para bodas y todo tipo de eventos' },
    { icon: '👥', text: 'Gestión inteligente de invitados' },
    { icon: '💰', text: 'Control de presupuesto en tiempo real' },
    { icon: '📋', text: 'Itinerario y coordinación todo en uno' },
    { icon: '🎨', text: 'Creador de webs de evento personalizado' },
  ],
  gradient: 'linear-gradient(150deg, #ec4899 0%, #a855f7 60%, #6366f1 100%)',
  headline: 'Tu asistente IA para organizar tu boda ideal',
  logoEmoji: '💒',
  stats: [
    { label: 'bodas organizadas', value: '+5.000' },
    { label: 'fotos compartidas', value: '+200K' },
    { label: 'valoración media', value: '4.9★' },
  ],
};

function LeftPanel({ config }: { config: Required<Omit<LeftPanelConfig, 'eventTypesForRotation'>> & { eventTypesForRotation?: string[] } }) {
  const eventTypes = config.eventTypesForRotation ?? [];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (eventTypes.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % eventTypes.length), 2500);
    return () => clearInterval(t);
  }, [eventTypes.length]);

  const useDynamicHeadline = eventTypes.length > 0;
  const eventLabel = useDynamicHeadline ? eventTypes[index] : '';

  return (
    <div
      style={{
        background: config.gradient,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100%',
        overflow: 'hidden',
        padding: '48px 40px',
        position: 'relative',
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          height: 300,
          left: -80,
          position: 'absolute',
          top: -80,
          width: 300,
        }}
      />
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          bottom: -60,
          height: 200,
          position: 'absolute',
          right: -40,
          width: 200,
        }}
      />

      {/* Logo + brand */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{config.logoEmoji}</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 2,
            opacity: 0.9,
            textTransform: 'uppercase',
          }}
        >
          {config.brandName}
        </div>
      </div>

      {/* Headline: dinámico (rotación por tipos de evento) o estático */}
      <h1
        style={{
          color: 'white',
          fontSize: 'clamp(22px, 2.8vw, 34px)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: 16,
          minHeight: useDynamicHeadline ? '1.2em' : undefined,
        }}
      >
        {useDynamicHeadline ? (
          <>
            Tu asistente IA para organizar tu{' '}
            <span style={{ display: 'inline-block', transition: 'opacity 0.4s ease', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 4 }}>
              {eventLabel}
            </span>
            {' '}ideal
          </>
        ) : (
          config.headline
        )}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 32, opacity: 0.9 }}>
        {config.description}
      </p>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {config.features.map((f) => (
          <div key={f.text} style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span style={{ fontSize: 14, opacity: 0.95 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Stats (opcional; apps pueden pasar stats: [] para una sola pantalla más limpia) */}
      {config.stats.length > 0 && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            gap: 24,
            paddingTop: 24,
          }}
        >
          {config.stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SplitLoginPage — Layout de pantalla dividida compartido para todas las apps del monorepo.
 *
 * Panel izquierdo: propuesta de valor (configurable via `leftPanel` prop)
 * Panel derecho: contenido del formulario (children)
 *
 * Responsive: panel izquierdo oculto en móvil (≤768px)
 */
export function SplitLoginPage({ children, leftPanel }: SplitLoginPageProps) {
  const config = {
    ...DEFAULT_LEFT_PANEL,
    ...leftPanel,
    eventTypesForRotation: leftPanel?.eventTypesForRotation ?? DEFAULT_LEFT_PANEL.eventTypesForRotation,
    features: leftPanel?.features ?? DEFAULT_LEFT_PANEL.features,
    stats: leftPanel?.stats ?? DEFAULT_LEFT_PANEL.stats,
  } as Required<Omit<LeftPanelConfig, 'eventTypesForRotation'>> & { eventTypesForRotation?: string[] };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(260px, 42%, 460px) 1fr',
        minHeight: '100vh',
      }}
    >
      {/* Left panel: value proposition (hidden on mobile) */}
      <div className="auth-ui-left-panel">
        <LeftPanel config={config} />
      </div>

      {/* Right panel: form content */}
      <div
        style={{
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-ui-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default SplitLoginPage;
