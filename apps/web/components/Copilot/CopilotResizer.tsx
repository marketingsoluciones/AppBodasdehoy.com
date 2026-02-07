/**
 * CopilotResizer - Handle para redimensionar el split-view
 *
 * Permite arrastrar para cambiar el ancho del panel de chat
 */

import { FC, useCallback, useEffect, useRef, memo } from 'react';

interface CopilotResizerProps {
  onResizeStart: () => void;
  onResize: (deltaX: number) => void;
  onResizeEnd: () => void;
  isResizing: boolean;
}

const CopilotResizer: FC<CopilotResizerProps> = ({
  onResizeStart,
  onResize,
  onResizeEnd,
  isResizing,
}) => {
  const lastXRef = useRef<number>(0);

  // Manejar inicio de resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    lastXRef.current = e.clientX;
    onResizeStart();
  }, [onResizeStart]);

  // Manejar movimiento durante resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      onResize(deltaX);
    };

    const handleMouseUp = () => {
      onResizeEnd();
    };

    // Prevenir seleccion de texto durante resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize, onResizeEnd]);

  return (
    <div
      className={`
        w-1 h-full cursor-col-resize
        bg-gray-200 hover:bg-blue-400
        transition-colors duration-150
        flex-shrink-0
        group
        ${isResizing ? 'bg-blue-500' : ''}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Indicador visual de arrastre */}
      <div
        className={`
          w-4 h-full -ml-1.5
          flex items-center justify-center
          opacity-0 group-hover:opacity-100
          ${isResizing ? 'opacity-100' : ''}
          transition-opacity duration-150
        `}
      >
        <div className="flex flex-col gap-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default memo(CopilotResizer);
