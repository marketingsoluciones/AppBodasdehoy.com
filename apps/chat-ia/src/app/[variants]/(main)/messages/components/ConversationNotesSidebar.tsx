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
 * Nota sobre el workaround del bug Mongo enum CONVERSATION:
 *   api-mcp aún no acepta entityType: CONVERSATION en Mongo. Usamos
 *   entityType: ENTITY como catch-all. Cuando lo arreglen, cambiar
 *   `entityType: 'ENTITY'` → `entityType: 'CONVERSATION'` aquí abajo.
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
  /** Mostrar variante compacta (mobile sheet, paneles pequeños). */
  compact?: boolean;
}

export function ConversationNotesSidebar({
  conversationId,
  contactName,
  linkedContactId,
  linkedEventId,
  compact = false,
}: ConversationNotesSidebarProps) {
  // Migración una vez por sesión (idempotente: no hace nada si ya migrado).
  useEffect(() => {
    void migrateLocalStorageNotesToCRM().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[CRM notes] migración localStorage falló (se reintenta luego):', err?.message ?? err);
    });
  }, []);

  // Entidad principal: si hay linked_contact_id, las notas pertenecen al
  // CONTACTO (vida del contacto, supervive a la conv). Si no, usamos la
  // conversación como entidad ENTITY (workaround bug Mongo, ver header).
  const entity: CRMEntityRef = linkedContactId
    ? {
        entityId: linkedContactId,
        entityName: contactName ?? 'Contacto',
        entityType: 'CONTACT',
      }
    : {
        entityId: conversationId,
        entityName: contactName ?? `Conversación ${conversationId.slice(0, 8)}`,
        // WORKAROUND bug Mongo: usar ENTITY hasta que api-mcp arregle enum.
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
