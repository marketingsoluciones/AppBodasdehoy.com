import { FC, useState, useRef, useEffect } from "react";
import { ColumnConfig } from "./types";
import { GoChevronDown } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import { TbColumns3 } from "react-icons/tb";

interface ColumnToggleProps {
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
}

export const ColumnToggle: FC<ColumnToggleProps> = ({
  columns,
  visibleColumns,
  onToggleColumn,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-1 text-xs text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none "
      >
        <TbColumns3 className="w-3.5 h-3.5" />
        {t("columns") || "Columnas"}
        <GoChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
            {t("show_columns") || "Mostrar columnas"}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.has(column.id)}
                  onChange={() => onToggleColumn(column.id)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                />
                <span className="ml-3 text-xs text-gray-700">
                  {column.Header}
                </span>
              </label>
            ))}
          </div>
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 mt-2">
            {visibleColumns.size} de {columns.length} visibles
          </div>
        </div>
      )}
    </div>
  );
};

