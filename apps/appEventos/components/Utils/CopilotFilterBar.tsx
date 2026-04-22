import { FC } from "react";
import { EventsGroupContextProvider } from "../../context";

const entityLabels: Record<string, string> = {
  events: "evento",
  guests: "invitado",
  tables: "mesa",
  services: "servicio",
  moments: "momento",
  budget_items: "partida",
  invitations: "invitación",
  gifts: "regalo",
};

interface CopilotFilterBarProps {
  entity: string | string[];
  className?: string;
}

const CopilotFilterBar: FC<CopilotFilterBarProps> = ({ entity, className }) => {
  const { copilotFilter, clearCopilotFilter } = EventsGroupContextProvider();

  const entities = Array.isArray(entity) ? entity : [entity];
  const isActive = copilotFilter && entities.includes(copilotFilter.entity) && (copilotFilter.ids?.length ?? 0) > 0;

  if (!isActive) return null;

  const count = copilotFilter.ids?.length ?? 0;
  const label = entityLabels[copilotFilter.entity] ?? copilotFilter.entity;

  return (
    <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 bg-pink-100 border border-pink-300 rounded-lg text-xs text-pink-700 ${className ?? ""}`}>
      <span>🔍</span>
      <span className="flex-1 truncate">
        {copilotFilter.query
          ? `Filtro: "${copilotFilter.query}" · ${count} ${label}(s)`
          : `Filtro activo · ${count} ${label}(s)`}
      </span>
      <button
        onClick={clearCopilotFilter}
        className="ml-1 min-w-[32px] min-h-[32px] p-1 flex items-center justify-center text-pink-400 hover:text-pink-600 font-bold leading-none rounded hover:bg-pink-200 transition-colors"
        aria-label="Quitar filtro"
        title="Quitar filtro"
      >
        ✕
      </button>
    </div>
  );
};

export default CopilotFilterBar;
