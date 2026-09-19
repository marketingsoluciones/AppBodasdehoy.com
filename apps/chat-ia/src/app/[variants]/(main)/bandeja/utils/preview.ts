/**
 * previewText — qué se lee bajo el nombre en la lista de conversaciones.
 *
 * Auditoría de usabilidad 17-09: cuando el último mensaje no traía texto (una foto, un
 * audio), la fila terminaba mostrando el nombre del canal y se leía "Tú: WhatsApp", que no
 * dice nada de esa conversación y ocupa lo mismo que una vista previa útil.
 */
export function previewText(
  texto: string | null | undefined,
  tipo?: string | null,
): string {
  const limpio = (texto ?? '').trim();
  if (limpio) return limpio;

  switch ((tipo ?? '').toLowerCase()) {
    case 'image':
    case 'imagen': {
      return '📷 Imagen';
    }
    case 'audio':
    case 'ptt':
    case 'voice': {
      return '🎤 Audio';
    }
    case 'video': {
      return '🎬 Vídeo';
    }
    case 'document':
    case 'documento': {
      return '📎 Documento';
    }
    case 'sticker': {
      return 'Sticker';
    }
    case 'location':
    case 'ubicacion': {
      return '📍 Ubicación';
    }
    default: {
      // "Sin mensajes aún": lo de antes ("Sin mensajes") se leía como un estado permanente
      // y aparecía en toda conversación recién creada (brief 18-09, P2.1).
      return 'Sin mensajes aún';
    }
  }
}
