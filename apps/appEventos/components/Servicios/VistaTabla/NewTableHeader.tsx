import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Settings,
  Grid3X3,
  List,
  MoreHorizontal,
  X,
  ChevronDown,
  Eye
} from 'lucide-react';
import { TableColumn } from './NewTypes';
import { ColumnConfigModal } from './NewColumnMenu';
import { useTranslation } from 'react-i18next';
import { isStudioPathname } from '../../../utils/studioPaths';

interface TableHeaderProps {
  title: string;
  totalItems: number;
  selectedItems: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddTask: () => void;
  onExport: () => void;
  onImport: () => void;
  viewMode: 'table' | 'board';
  onViewModeChange: (mode: 'table' | 'board') => void;
  columns: TableColumn[];
  hiddenColumns: string[];
  onToggleColumn: (columnId: string) => void;
  onFiltersToggle: () => void;
  filtersActive: boolean;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  totalItems,
  selectedItems,
  searchValue,
  onSearchChange,
  onAddTask,
  onExport,
  onImport,
  viewMode,
  onViewModeChange,
  columns,
  hiddenColumns,
  onToggleColumn,
  onFiltersToggle,
  filtersActive
}) => {
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { t } = useTranslation();

  const visibleColumnsCount = columns.filter(col => !hiddenColumns.includes(col.id) && col.id !== 'actions').length;

  // Barra de tareasvistatabla.html: UNA sola fila, sin título (el nombre de la lista ya
  // está en el rectángulo de arriba). Izquierda: buscador + filtros + columnas + recuento.
  // Derecha: "Añadir tarea" + importar + exportar. Mismos manejadores de siempre.
  const isStudio = typeof window !== "undefined"
    && isStudioPathname(window.location.pathname)
    && new URLSearchParams(window.location.search).get("studio") !== "legacy";

  const btnIco: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#fff",
    color: "#8a8a90", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0, flex: "none",
  };

  if (isStudio) {
    return (
      <>
        {showColumnConfig && (
          <ColumnConfigModal
            columns={columns}
            hiddenColumns={hiddenColumns}
            onToggleColumn={onToggleColumn}
            onClose={() => setShowColumnConfig(false)}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 10px 12px", flexWrap: "wrap", fontFamily: "'Poppins',sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "0 14px", height: 36, minWidth: 220, background: "#fff" }}>
              <Search className="w-[14px] h-[14px]" style={{ color: "#8a8a90", flex: "none" }} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('Buscar tareas…', { defaultValue: 'Buscar tareas…' })}
                style={{ border: "none", outline: "none", font: "400 12.5px Poppins", color: "#3A3A42", width: "100%", background: "transparent" }}
              />
            </div>
            <button onClick={onFiltersToggle} title={t('Filtros', { defaultValue: 'Filtros' })} style={{ ...btnIco, borderColor: filtersActive ? "#EF5B94" : "#E7E7EA", color: filtersActive ? "#EF5B94" : "#8a8a90" }}>
              <Filter className="w-[15px] h-[15px]" />
            </button>
            <button onClick={() => setShowColumnConfig(true)} title={t('Configurar columnas', { defaultValue: 'Configurar columnas' })} style={btnIco}>
              <Eye className="w-[15px] h-[15px]" />
            </button>
            <span style={{ font: "400 12px Poppins", color: "#a0a0a8", whiteSpace: "nowrap" }}>
              {totalItems} {t('tareas')}{selectedItems > 0 ? ` · ${selectedItems} ${t('seleccionadas', { defaultValue: 'seleccionadas' })}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onAddTask} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 12, background: "#EF5B94", color: "#fff", font: "600 12.5px Poppins", border: "none", cursor: "pointer", boxShadow: "0 5px 14px rgba(239,91,148,.28)", whiteSpace: "nowrap" }}>
              <Plus className="w-[13px] h-[13px]" />
              {t('Añadir tarea', { defaultValue: 'Añadir tarea' })}
            </button>
            <button onClick={onImport} title={t('Importar', { defaultValue: 'Importar' })} style={btnIco}>
              <Upload className="w-[15px] h-[15px]" />
            </button>
            <button onClick={onExport} title={t('Exportar', { defaultValue: 'Exportar' })} style={btnIco}>
              <Download className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
      </>
    );
  }


  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3 text-xs">
        {/* Primera fila: Título y controles principales */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
            <div className="flex items-center text-gray-500">
              <span>{totalItems} {t('tareas')}</span>
              {selectedItems > 0 && (
                <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full ">
                  {selectedItems} {t('seleccionadas')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón de agregar */}
            <button
              onClick={onAddTask}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Nueva tarea')}</span>
            </button>

            {/* Menú de más opciones */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onExport();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('Exportar')}</span>
                    </button>
                    <button
                      onClick={() => {
                        onImport();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{t('Importar')}</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setShowColumnConfig(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('Configurar columnas')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Segunda fila: Búsqueda y filtros */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Barra de búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('Buscar tareas...')}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="text-sm w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botón de filtros */}
            <button
              onClick={onFiltersToggle}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md transition-colors
                ${filtersActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>{t('Filtros')}</span>
              {filtersActive && (
                <span className="bg-primary text-white px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Información de columnas */}
          <div className="flex items-center space-x-3 text-gray-500">
            <button
              onClick={() => setShowColumnConfig(true)}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{visibleColumnsCount} {t('de')} {columns.filter(col => col.id !== 'actions').length} {t('columnas')}</span>
            </button>
          </div>
        </div>

        {/* Tercera fila: Acciones en lote (solo visible cuando hay selecciones) */}
        {selectedItems > 0 && (
          <div className="flex items-center justify-between mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-primary">
                {selectedItems} {t('tareas seleccionadas')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors">
                {t('Cambiar estado')}
              </button>
              <button className="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors">
                {t('Asignar')}
              </button>
              <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                {t('Eliminar')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de configuración de columnas */}
      {showColumnConfig && (
        <ColumnConfigModal
          columns={columns}
          hiddenColumns={hiddenColumns}
          onToggleColumn={onToggleColumn}
          onClose={() => setShowColumnConfig(false)}
        />
      )}
    </>
  );
};

// Componente adicional para el mini header de la tabla
export const TableMiniHeader: React.FC<{
  sortBy: { id: string; desc: boolean }[];
  onSort: (columnId: string) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}> = ({ sortBy, onSort, onSelectAll, allSelected, someSelected }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected && !allSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          <span className="text-gray-600">{t('Seleccionar todo')}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-500">
          {sortBy.length > 0 && (
            <div className="flex items-center space-x-1">
              <span>{t('Ordenado por')}:</span>
              {sortBy.map((sort, index) => (
                <span key={`sort-${sort.id}-${index}`} className="flex items-center">
                  {index > 0 && <span className="mx-1">,</span>}
                  <span className="font-medium">{sort.id}</span>
                  <ChevronDown className={`w-3 h-3 ml-1 ${sort.desc ? 'rotate-180' : ''}`} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};