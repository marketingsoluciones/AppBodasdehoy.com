/**
 * UploadTray — UI flotante esquina derecha mostrando subidas en progreso.
 *
 * - Aparece solo si hay items en la cola.
 * - Lista con icono por tipo + progreso + retry/cancel por item.
 * - Botón global "Limpiar terminadas" cuando hay done.
 *
 * Diseño minimalista — patrón estándar tipo Drive/Slack.
 */

import React, { useState } from 'react';
import { useUploader } from '@bodasdehoy/shared/upload';
import { useUploadQueue } from './UploadProvider';
import { X, ChevronDown, ChevronUp, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileSpreadsheet, File, RefreshCw, Check, AlertCircle } from 'lucide-react';

function getIconByCategory(category: string, fileName: string): React.ReactElement {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (category === 'photos') return <FileImage className="w-4 h-4 text-primary shrink-0" />;
  if (category === 'videos') return <FileVideo className="w-4 h-4 text-secondary shrink-0" />;
  if (category === 'audio') return <FileAudio className="w-4 h-4 text-green-500 shrink-0" />;
  if (category === 'archives') return <FileArchive className="w-4 h-4 text-yellow-500 shrink-0" />;
  if (category === 'documents') {
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
  }
  return <File className="w-4 h-4 text-gray-500 shrink-0" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadTray() {
  const queue = useUploadQueue();
  const { items, active, done, errored, totalProgress, cancel, retry, clearDone } = useUploader(queue);
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  const allDone = active.length === 0 && errored.length === 0;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      role="region"
      aria-label="Subidas en curso"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          {allDone ? (
            <Check className="w-4 h-4 text-green-500 shrink-0" />
          ) : errored.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-700 truncate">
            {allDone
              ? `${done.length} subidas completadas`
              : `${active.length} subiendo · ${totalProgress}%`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-gray-200 transition"
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {allDone && (
            <button
              onClick={clearDone}
              className="p-1 rounded hover:bg-gray-200 transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {!collapsed && (
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="px-3 py-2 flex items-center gap-2">
              {getIconByCategory(item.category, item.file.name)}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 truncate" title={item.file.name}>
                  {item.file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {formatSize(item.file.size)}
                  </span>
                  {item.status === 'uploading' && (
                    <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === 'queued' && (
                    <span className="text-[10px] text-gray-500">En cola</span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> OK
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span
                      className="text-[10px] text-red-600 flex items-center gap-0.5 truncate"
                      title={item.error}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {item.error || 'Error'}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-0.5">
                {item.status === 'error' && (
                  <button
                    onClick={() => retry(item.id)}
                    className="p-1 rounded hover:bg-gray-100 transition"
                    aria-label="Reintentar"
                    title="Reintentar"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
                {item.status !== 'done' && (
                  <button
                    onClick={() => cancel(item.id)}
                    className="p-1 rounded hover:bg-gray-100 transition"
                    aria-label="Cancelar"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Footer si hay done mezclado con activos */}
      {!collapsed && done.length > 0 && active.length > 0 && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={clearDone}
            className="text-[11px] text-gray-600 hover:text-gray-900 transition"
          >
            Limpiar terminadas ({done.length})
          </button>
        </div>
      )}
    </div>
  );
}
