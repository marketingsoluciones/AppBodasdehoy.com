/**
 * Editor Web - Web solo del Creador de webs (bodas/eventos).
 * Redirige al editor completo en chat-ia hasta que el paquete @bodasdehoy/wedding-creator
 * exporte el componente de edición.
 */
import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';
import Link from 'next/link';

export default function EditorWebPage() {
  const development =
    typeof window !== 'undefined'
      ? getDevelopmentNameFromHostname(window.location.hostname)
      : 'bodasdehoy';
  const base =
    typeof window !== 'undefined'
      ? resolveChatOrigin(window.location.hostname)
      : process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
  const url = `${base.replace(/\/$/, '')}/${development}/wedding-creator`;

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Creador de webs</h1>
      <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
        Crea y edita la web de tu boda o evento: información, programa, ubicación, galería, RSVP y más.
        El editor completo está en chat-ia.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#ec4899',
            color: 'white',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Abrir Creador en chat-ia
        </a>
        <Link
          href="/preview"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#f3f4f6',
            color: '#374151',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #e5e7eb',
          }}
        >
          Ver vista previa de ejemplo
        </Link>
      </div>
      <p style={{ marginTop: 24, fontSize: 14, color: '#888' }}>
        Dominio ejemplo en producción: creador.bodasdehoy.com
      </p>
    </div>
  );
}
