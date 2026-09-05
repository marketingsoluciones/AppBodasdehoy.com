import React from 'react';
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Save,
  Download,
  Zap,
  Layers,
  Hash,
  X,
} from 'lucide-react';
import { Itinerary } from '../../../utils/Interfaces';
import { BoardColumn } from '../types';
import { useTranslation } from 'react-i18next';
import { isStudioPathname } from '../../../utils/studioPaths';

interface BoardHeaderProps {
  itinerario: Itinerary;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  draggedItem: any;
  visibleColumns: BoardColumn[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilters: Record<string, any>;
  isGlobalCollapsed: boolean;
  onToggleGlobalCollapse: () => void;
  onManualSave: () => void;
  onExport: () => void;
  onShowShortcuts: () => void;
  /** Toolbar del HTML: crear tarea (en Pendiente) y expandir el tablero a lo ancho. */
  onAddTask?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  totalTasks?: number;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  itinerario,
  isSaving,
  hasUnsavedChanges,
  draggedItem,
  visibleColumns,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFilters,
  isGlobalCollapsed,
  onToggleGlobalCollapse,
  onManualSave,
  onExport,
  onShowShortcuts,
  onAddTask,
  expanded = false,
  onToggleExpand,
  totalTasks,
}) => {
  const { t } = useTranslation();

  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";
  const ico: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#fff", color: "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, flex: "none" };

  if (isStudio) {
    const nCols = visibleColumns?.length ?? 4;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "4px 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "0 14px", height: 36, minWidth: 200, background: "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder={t("Buscar tareas…", { defaultValue: "Buscar tareas…" })} style={{ border: "none", outline: "none", font: "400 12.5px Poppins", color: "#3A3A42", width: "100%", background: "transparent" }} />
          </div>
          <button onClick={onToggleFilters} title={t("Filtros", { defaultValue: "Filtros" })} style={{ ...ico, borderColor: showFilters ? "#EF5B94" : "#E7E7EA", color: showFilters ? "#EF5B94" : "#8a8a90" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>
          </button>
          <span style={{ font: "400 12px Poppins", color: "#a0a0a8", whiteSpace: "nowrap" }}>{nCols} {t("columnas", { defaultValue: "columnas" })} · {totalTasks ?? 0} {t("tareas")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={onAddTask} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)", whiteSpace: "nowrap" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {t("Añadir tarea", { defaultValue: "Añadir tarea" })}
          </button>
          <button onClick={onExport} title={t("Exportar", { defaultValue: "Exportar" })} style={ico}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></svg>
          </button>
          {onToggleExpand && (
            <button onClick={onToggleExpand} title={expanded ? t("Contraer", { defaultValue: "Contraer" }) : t("Expandir", { defaultValue: "Expandir" })} style={{ ...ico, borderColor: expanded ? "#EF5B94" : "#E7E7EA", color: expanded ? "#EF5B94" : "#8a8a90" }}>
              {expanded
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm p-4 flex md:flex-row flex-col items-center justify-between">
      <div className="flex items-center space-x-4 first:uppercase">
        <h2 className="text-xl font-semibold text-gray-800">
          {itinerario.title} - Vista Tablero
        </h2>
        {(isSaving || hasUnsavedChanges || draggedItem) && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {isSaving || draggedItem ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>{draggedItem ? t('Moviendo tarea...') : t('Guardando cambios...')}</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{t('Cambios sin guardar')}</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-x-2 space-y-2 md:space-y-0">
        {/* Indicadores de estado */}
        <div className="flex items-center space-x-3 text-sm p-2 md:space-y-0 md:p-0">
          <span className="flex items-center space-x-1 text-gray-500">
            <Layers className="w-4 h-4" />
            <span>{visibleColumns.length} columnas</span>
          </span>
          <span className="flex items-center space-x-1 text-gray-500">
            <Hash className="w-4 h-4" />
            <span>
              {visibleColumns.reduce((acc, col) => acc + col.tasks.length, 0)} tareas
            </span>
          </span>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 md:pr-4. py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          {/* Botones de acción */}
          <button
            onClick={onToggleFilters}
            className={`p-2 rounded-md transition-colors ${showFilters || Object.keys(activeFilters).length > 0
              ? 'bg-base text-primary'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            title="Filtros"
          >
            <Filter className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleGlobalCollapse}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title={isGlobalCollapsed ? 'Expandir todo' : 'Contraer todo'}
          >
            {isGlobalCollapsed ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>

          {/* Botón de guardar manual */}
          {hasUnsavedChanges && (
            <button
              onClick={onManualSave}
              disabled={isSaving}
              className={`p-2 rounded-md transition-colors ${isSaving
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-primary hover:text-white hover:bg-primary bg-base'
                }`}
              title="Guardar cambios (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onExport}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Exportar datos"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onShowShortcuts}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Atajos de teclado (Ctrl+H)"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>


      </div>

    </div>

  );
};
