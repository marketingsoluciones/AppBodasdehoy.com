'use client';

/**
 * ConversationNotesSidebar — sidebar derecho de /messages.
 *
 * Renderiza el NotesPanel universal de `@bodasdehoy/shared/crm-ui` con la
 * entidad CONVERSATION + el CONTACT vinculado (si existe) como alsoShow.
 *
 * Diseño FASE B v2.0 (24-jun):
 *   · Desktop ≥ 1024px: visible inline, 280px de ancho.
 *   · Tablet/Mobile: oculto por defecto (el usuario lo abre desde header).
 *   · Migración localStorage → CRM_Note se dispara una vez al montar.
 *
 * Enum CONVERSATION: corregido por api-mcp commit aba3f09 (24-jun-2026).
 * Usamos entityType:'CONVERSATION' directo. El resolver valida que el
 * conversation_id sea real (WhatsAppConversation), no inventado.
 */

import { useEffect } from 'react';

import {
  migrateLocalStorageNotesToCRM,
  NotesPanel,
  type CRMEntityRef,
} from '@bodasdehoy/shared/crm-ui';

interface ConversationNotesSidebarProps {
  conversationId: string;
  contactName?: string;
  linkedContactId?: string | null;
  linkedEventId?: string | null;
  /** Canal de la conversación (whatsapp|instagram|telegram|email|web|facebook).
   *  Si NO es 'whatsapp', el resolver api-mcp valida contra WhatsAppConversation
   *  y devuelve HTTP 400. En esos casos usamos CONTACT (si hay linkedContactId)
   *  o ENTITY como entityType para evitar el 400. */
  channel?: string;
  /** Mostrar variante compacta (mobile sheet, paneles pequeños). */
  compact?: boolean;
}

export function ConversationNotesSidebar({
  conversationId,
  contactName,
  linkedContactId,
  linkedEventId,
  channel,
  compact = false,
}: ConversationNotesSidebarProps) {
  // Migración una vez por sesión (idempotente: no hace nada si ya migrado).
  useEffect(() => {
    void migrateLocalStorageNotesToCRM().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[CRM notes] migración localStorage falló (se reintenta luego):', err?.message ?? err);
    });
  }, []);

  // Entidad principal: lógica por canal (fix QA bug HTTP 400 25-jun):
  //   1. Si hay linkedContactId → CONTACT (siempre que sea posible, vida del contacto)
  //   2. WhatsApp + sin contacto → CONVERSATION (resolver valida WhatsAppConversation)
  //   3. Otros canales (web/email/instagram/telegram/facebook) sin contacto →
  //      ENTITY como catch-all (el resolver CONVERSATION rechaza ids no-WA con 400)
  const isWhatsApp = !channel || channel === 'whatsapp';
  const entity: CRMEntityRef = linkedContactId
    ? {
        entityId: linkedContactId,
        entityName: contactName ?? 'Contacto',
        entityType: 'CONTACT',
      }
    : isWhatsApp
      ? {
          entityId: conversationId,
          entityName: contactName ?? `Conversación ${conversationId.slice(0, 8)}`,
          entityType: 'CONVERSATION',
        }
      : {
          entityId: conversationId,
          entityName:
            contactName ?? `Conversación ${channel ?? 'web'} ${conversationId.slice(0, 8)}`,
          // Canal no-WA: el resolver CONVERSATION devuelve 400 (solo valida
          // WhatsAppConversation). Usar ENTITY como catch-all hasta que
          // api-mcp soporte conversaciones multi-canal o las CONVERSATION
          // se generalicen.
          entityType: 'ENTITY',
        };

  // Si la conversación está vinculada a un evento, mostramos también las
  // notas de ese evento (contexto cruzado para el agente).
  const alsoShow: CRMEntityRef[] = linkedEventId
    ? [{ entityId: linkedEventId, entityName: 'Evento vinculado', entityType: 'EVENTO' }]
    : [];

  return (
    <NotesPanel
      entity={entity}
      alsoShow={alsoShow}
      title={linkedContactId ? `Notas de ${contactName ?? 'contacto'}` : 'Notas de la conversación'}
      compact={compact}
    />
  );
}
