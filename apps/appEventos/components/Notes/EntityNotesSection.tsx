/**
 * EntityNotesSection — acordeón "Notas internas" reutilizable en appEventos.
 *
 * Envuelve <NotesPanel> de @bodasdehoy/shared/crm-ui en un <details> nativo
 * (cero deps) y añade automáticamente el evento activo como alsoShow para
 * navegación cruzada entre notas.
 *
 * Uso (un solo componente para los 5 módulos):
 *   <EntityNotesSection entityType="TASK" entityId={task._id} entityName={task.descripcion} />
 *   <EntityNotesSection entityType="ENTITY" entityId={categoria._id} entityName={categoria.titulo} />
 *   <EntityNotesSection entityType="EVENTO" entityId={event._id} entityName={event.nombre} />
 *
 * Diseño FASE B v2.0 (24-jun): acordeón colapsado por defecto → el usuario
 * abre cuando quiere (no satura la ficha). Se monta perezosamente: el hook
 * de notas solo se activa cuando el panel está abierto.
 */
import { useState } from 'react';
import {
  NotesPanel,
  type CRMEntityRef,
  type CRMNoteEntityType,
} from '@bodasdehoy/shared/crm-ui';
import { EventContextProvider } from '../../context';

interface EntityNotesSectionProps {
  entityType: CRMNoteEntityType;
  entityId: string;
  entityName: string;
  /** Mostrar el acordeón abierto por defecto. Default: false. */
  defaultOpen?: boolean;
  /** Variante compacta para sidebars estrechos. Default: false. */
  compact?: boolean;
}

export function EntityNotesSection({
  entityType,
  entityId,
  entityName,
  defaultOpen = false,
  compact = false,
}: EntityNotesSectionProps) {
  const { event } = EventContextProvider() as any;
  const [open, setOpen] = useState(defaultOpen);

  if (!entityId) return null;

  const entity: CRMEntityRef = { entityId, entityName, entityType };

  // Si la entidad NO es el propio evento, añadimos el evento como contexto
  // cruzado (alsoShow) para que el usuario vea notas vinculadas al evento.
  const alsoShow: CRMEntityRef[] =
    event?._id && entityType !== 'EVENTO'
      ? [{ entityId: event._id, entityName: event.nombre ?? 'Evento', entityType: 'EVENTO' }]
      : [];

  return (
    <details
      className="mt-4 rounded-lg border border-gray-200 bg-white"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Notas internas
      </summary>
      {open && (
        <div className="border-t border-gray-100 p-2">
          <NotesPanel entity={entity} alsoShow={alsoShow} compact={compact} />
        </div>
      )}
    </details>
  );
}
