import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { TaskCard } from '../VistaTarjeta/TaskCard';
import { BoardColumn as BoardColumnComponent } from './BoardColumn';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { DragItem, BoardColumn as BoardColumnType, BoardState } from '../types';

interface BoardDragOverlayProps {
  draggedItem: DragItem | null;
  boardState: BoardState;
  itinerario: Itinerary;
}

export const BoardDragOverlay: React.FC<BoardDragOverlayProps> = ({
  draggedItem,
  boardState,
  itinerario,
}) => {
  if (!draggedItem) return null;

  return (
    <DragOverlay>
      {draggedItem.type === 'task' ? (
        <TaskCard
          task={draggedItem.data as Task}
          column={draggedItem.sourceColumnId ? boardState.columns[draggedItem.sourceColumnId] : undefined}
          onTaskClick={() => { }}
          onTaskUpdate={() => { }}
          onTaskDelete={() => { }}
          onCreateSubTask={() => { }}
          onTaskCreate={() => { }}
          isSelected={false}
          isDragging={true}
          itinerario={itinerario}
        />
      ) : draggedItem.type === 'column' ? (
        <div className="opacity-50">
          <BoardColumnComponent
            column={draggedItem.data as BoardColumnType}
            onTaskClick={() => { }}
            onTaskUpdate={() => { }}
            onTaskDelete={() => { }}
            onTaskCreate={() => { }}
            onToggleCollapse={() => { }}
            onCreateSubTask={() => { }}
            selectedTask=""
            itinerario={itinerario}
            viewMode={boardState.viewMode || 'board'}
          />
        </div>
      ) : null}
    </DragOverlay>
  );
};