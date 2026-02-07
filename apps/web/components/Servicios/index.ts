// Exportar el componente principal
export { BoardView } from './VistaKanban/BoardView';

// Exportar tipos e interfaces
export * from './types';

// Exportar constantes
export * from './constants';

// Exportar utilidades
export * from './VistaKanban/boardViewUtils';

// Exportar manejadores
export * from './VistaKanban/dragDropHandlers';
export * from './VistaTarjeta/taskHandlers';

// Exportar componentes
export { BoardHeader } from './VistaKanban/BoardHeader';
export { ShortcutsModal } from './Utils/ShortcutsModal';
export { BoardDragOverlay } from './VistaKanban/BoardDragOverlay';