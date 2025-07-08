import React, { useState, useCallback } from 'react';
import { TableView } from './NewTableView';
import { Task, Itinerary, Event as EventInterface } from '../../../utils/Interfaces';
import { EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from 'react-i18next';

interface TableIntegrationProps {
  itinerario: Itinerary;
  event: EventInterface;
  data: Task[];
}

export const TableIntegration: React.FC<TableIntegrationProps> = ({
  itinerario,
  event: initialEvent,
  data: initialData
}) => {
  const { setEvent } = EventContextProvider();
  const toast = useToast();
  const { t } = useTranslation();
  
  const [tasks, setTasks] = useState<Task[]>(initialData);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  // Manejar actualización de tarea
  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    // Actualizar estado local
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === taskId ? { ...task, ...updates } : task
      )
    );
    
    // Actualizar evento global
    setEvent((prevEvent: EventInterface) => {
      const newEvent = { ...prevEvent };
      const itineraryIndex = newEvent.itinerarios_array.findIndex(
        it => it._id === itinerario._id
      );
      
      if (itineraryIndex > -1) {
        const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks.findIndex(
          t => t._id === taskId
        );
        
        if (taskIndex > -1) {
          newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex] = {
            ...newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex],
            ...updates
          };
        }
      }
      
      return newEvent;
    });
  }, [itinerario._id, setEvent]);
  
  // Manejar eliminación de tarea
  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await fetchApiEventos({
        query: queries.deleteTask,
        variables: {
          eventID: initialEvent._id,
          itinerarioID: itinerario._id,
          taskID: taskId
        },
        domain: process.env.NEXT_PUBLIC_BASE_URL
      });
      
      // Actualizar estado local
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      
      // Actualizar evento global
      setEvent((prevEvent: EventInterface) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(
          it => it._id === itinerario._id
        );
        
        if (itineraryIndex > -1) {
          newEvent.itinerarios_array[itineraryIndex].tasks = 
            newEvent.itinerarios_array[itineraryIndex].tasks.filter(
              t => t._id !== taskId
            );
        }
        
        return newEvent;
      });
      
      toast('success', t('Tarea eliminada correctamente'));
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      toast('error', t('Error al eliminar la tarea'));
    }
  }, [initialEvent._id, itinerario._id, setEvent, t, toast]);
  
  // Manejar creación de tarea
  const handleTaskCreate = useCallback(async (taskData: Partial<Task>) => {
    try {
      const createResponse = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          eventID: initialEvent._id,
          itinerarioID: itinerario._id,
          descripcion: taskData.descripcion || "Nueva tarea",
          fecha: taskData.fecha || new Date(),
          duracion: taskData.duracion || 30,
        },
        domain: process.env.NEXT_PUBLIC_BASE_URL
      });
      
      if (!createResponse) throw new Error("No se recibió respuesta del servidor");
      
      let newTask: Task;
      if (createResponse && typeof createResponse === "object" && "data" in createResponse) {
        newTask = (createResponse as { data: Task }).data;
      } else {
        newTask = createResponse as Task;
      }
      
      // Actualizar con datos completos
      const fullTaskData = {
        descripcion: taskData.descripcion || "Nueva tarea",
        fecha: taskData.fecha || new Date(),
        duracion: taskData.duracion || 30,
        responsable: taskData.responsable || [],
        tags: taskData.tags || [],
        attachments: taskData.attachments || [],
        tips: taskData.tips || "",
        spectatorView: taskData.spectatorView !== undefined ? taskData.spectatorView : true,
        estatus: taskData.estatus !== undefined ? taskData.estatus : false,
        estado: taskData.estado || 'pending',
        prioridad: taskData.prioridad || 'media',
      };
      
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: initialEvent._id,
          itinerarioID: itinerario._id,
          taskID: newTask._id,
          variable: "all",
          valor: JSON.stringify(fullTaskData)
        },
        domain: process.env.NEXT_PUBLIC_BASE_URL
      });
      
      const finalTask: Task = {
        ...newTask,
        ...fullTaskData
      };
      
      // Actualizar estado local
      setTasks(prevTasks => [...prevTasks, finalTask]);
      
      // Actualizar evento global
      setEvent((prevEvent: EventInterface) => {
        const newEvent = { ...prevEvent };
        const itineraryIndex = newEvent.itinerarios_array.findIndex(
          it => it._id === itinerario._id
        );
        
        if (itineraryIndex > -1) {
          newEvent.itinerarios_array[itineraryIndex].tasks.push(finalTask);
        }
        
        return newEvent;
      });
      
      // Seleccionar la nueva tarea
      setSelectedTaskId(finalTask._id);
      
      toast('success', t('Tarea creada correctamente'));
    } catch (error) {
      console.error('Error al crear tarea:', error);
      toast('error', t('Error al crear la tarea'));
    }
  }, [initialEvent._id, itinerario._id, setEvent, t, toast]);
  
  return (
    <div className="h-full w-full">
      <TableView
        data={tasks}
        itinerario={itinerario}
        selectTask={selectedTaskId}
        setSelectTask={setSelectedTaskId}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onTaskCreate={handleTaskCreate}
      />
    </div>
  );
};