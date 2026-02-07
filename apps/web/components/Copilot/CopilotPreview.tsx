/**
 * CopilotPreview - Preview de paginas de AppBodasdeHoy
 *
 * Muestra las paginas de la app en un iframe
 * cuando el MCP devuelve URLs
 */

import { forwardRef, useState, useCallback, memo, useEffect } from 'react';
import { BiLinkExternal, BiRefresh } from 'react-icons/bi';

interface CopilotPreviewProps {
  url: string;
  onUrlChange: (url: string) => void;
}

const CopilotPreview = forwardRef<HTMLIFrameElement, CopilotPreviewProps>(
  ({ url, onUrlChange }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [inputUrl, setInputUrl] = useState(url);

    // Sincronizar input con url prop
    useEffect(() => {
      setInputUrl(url);
    }, [url]);

    // Manejar carga del iframe
    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    // Manejar navegacion manual
    const handleNavigate = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      setIsLoaded(false);
      onUrlChange(inputUrl);
    }, [inputUrl, onUrlChange]);

    // Abrir en nueva pestana
    const handleOpenExternal = useCallback(() => {
      window.open(url, '_blank');
    }, [url]);

    // Refrescar iframe
    const handleRefresh = useCallback(() => {
      setIsLoaded(false);
      const iframe = ref as React.RefObject<HTMLIFrameElement>;
      if (iframe?.current) {
        iframe.current.src = iframe.current.src;
      }
    }, [ref]);

    // Construir URL completa para el iframe
    const fullUrl = url.startsWith('http')
      ? url
      : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;

    return (
      <div className="h-full w-full flex flex-col bg-gray-50">
        {/* Barra de navegacion del preview */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
          {/* Boton refresh */}
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Refrescar"
          >
            <BiRefresh className="w-4 h-4" />
          </button>

          {/* Input de URL */}
          <form onSubmit={handleNavigate} className="flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/ruta..."
            />
          </form>

          {/* Boton abrir externo */}
          <button
            onClick={handleOpenExternal}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Abrir en nueva pestana"
          >
            <BiLinkExternal className="w-4 h-4" />
          </button>
        </div>

        {/* Contenedor del iframe */}
        <div className="flex-1 relative">
          {/* Loading indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {/* Preview iframe */}
          <iframe
            ref={ref}
            src={fullUrl}
            className={`w-full h-full border-none transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>

        {/* Barra de estado */}
        <div className="flex items-center justify-between px-3 py-1 bg-gray-100 border-t border-gray-200 text-xs text-gray-500">
          <span>
            {isLoaded ? 'Cargado' : 'Cargando...'}
          </span>
          <span className="truncate max-w-[300px]">
            {fullUrl}
          </span>
        </div>
      </div>
    );
  }
);

CopilotPreview.displayName = 'CopilotPreview';

export default memo(CopilotPreview);
