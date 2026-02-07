/**
 * CopilotHeader - Header con controles del Copilot
 *
 * Muestra botones para:
 * - Volver atras
 * - Ir al home
 * - Cambiar modo de vista (split, chat-full, preview-full)
 * - Refrescar preview
 */

import { FC, memo } from 'react';
import { useRouter } from 'next/navigation';
import { BiArrowBack, BiHome, BiExpand, BiCollapse, BiChat, BiWindow, BiRefresh } from 'react-icons/bi';

type ViewMode = 'split' | 'chat-full' | 'preview-full';

interface CopilotHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onRefreshPreview: () => void;
  previewUrl: string;
}

const CopilotHeader: FC<CopilotHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onRefreshPreview,
  previewUrl,
}) => {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Navegacion izquierda */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Volver (Esc en modo completo)"
        >
          <BiArrowBack className="w-5 h-5" />
          <span className="hidden sm:inline">Volver</span>
        </button>

        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Ir al inicio"
        >
          <BiHome className="w-5 h-5" />
          <span className="hidden sm:inline">Inicio</span>
        </button>
      </div>

      {/* Titulo central */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-800">
          Copilot
        </span>
        {viewMode !== 'split' && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {viewMode === 'chat-full' ? 'Chat completo' : 'Preview completo'}
          </span>
        )}
      </div>

      {/* Controles derecha */}
      <div className="flex items-center gap-2">
        {/* URL actual del preview */}
        {viewMode !== 'chat-full' && (
          <span className="hidden md:inline text-xs text-gray-400 max-w-[200px] truncate">
            {previewUrl}
          </span>
        )}

        {/* Boton de refresh */}
        {viewMode !== 'chat-full' && (
          <button
            onClick={onRefreshPreview}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refrescar preview"
          >
            <BiRefresh className="w-5 h-5" />
          </button>
        )}

        {/* Botones de modo de vista */}
        {viewMode === 'split' && (
          <>
            <button
              onClick={() => onViewModeChange('chat-full')}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expandir chat (Cmd+Shift+E)"
            >
              <BiChat className="w-5 h-5" />
              <BiExpand className="w-4 h-4" />
            </button>

            <button
              onClick={() => onViewModeChange('preview-full')}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expandir preview (Cmd+Shift+E)"
            >
              <BiWindow className="w-5 h-5" />
              <BiExpand className="w-4 h-4" />
            </button>
          </>
        )}

        {viewMode === 'chat-full' && (
          <button
            onClick={() => onViewModeChange('split')}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Mostrar preview (Escape)"
          >
            <BiWindow className="w-5 h-5" />
            <span className="hidden sm:inline">Mostrar Preview</span>
          </button>
        )}

        {viewMode === 'preview-full' && (
          <button
            onClick={() => onViewModeChange('split')}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Mostrar chat (Escape)"
          >
            <BiChat className="w-5 h-5" />
            <span className="hidden sm:inline">Mostrar Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default memo(CopilotHeader);
