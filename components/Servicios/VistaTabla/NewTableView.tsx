import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTable, useSortBy, useRowSelect, useGlobalFilter } from 'react-table';
import {
  TableProps,
  TableColumn,
  TableState,
  TableFilter,
  ViewConfig,
  TASK_STATUSES,
  TASK_PRIORITIES
} from './NewTypes';
import { TableHeader } from './NewTableHeader';
import { TableFilters } from './NewTableFilters';
import { TableCell } from './NewTableCell';
import { ColumnMenu } from './NewColumnMenu';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../hooks/useToast';
import {
  MessageSquare,
  Edit2,
  Paperclip,
  MoreHorizontal,
  Eye,
  EyeOff,
  GitBranch,
  Link,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { CommentModal } from '../CommentModal';
import { TableEditModal } from './TableEditModal';
import { customAlphabet } from 'nanoid';
import * as XLSX from 'xlsx';
import { Task } from '../../../utils/Interfaces';

// Función auxiliar para descargar archivos sin file-saver
const downloadFile = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Definir las columnas con adjuntos incluido
const defineColumns = (t: any): TableColumn[] => [
  {
    id: 'descripcion',
    Header: t('title'),
    accessor: 'descripcion',
    width: 250,
    minWidth: 150,
    maxWidth: 400,
    canResize: true,
    type: 'text',
    truncate: 30
  },
  {
    id: 'estado',
    Header: 'Estado',
    accessor: 'estado',
    width: 130,
    minWidth: 100,
    maxWidth: 180,
    canResize: true,
    type: 'select',
    options: TASK_STATUSES
  },
  {
    id: 'prioridad',
    Header: 'Prioridad',
    accessor: 'prioridad',
    width: 120,
    minWidth: 100,
    maxWidth: 160,
    canResize: true,
    type: 'priority',
    options: TASK_PRIORITIES
  },
  {
    id: 'responsable',
    Header: t('responsible'),
    accessor: 'responsable',
    width: 200,
    minWidth: 150,
    maxWidth: 300,
    canResize: true,
    type: 'responsable'
  },
  {
    id: 'fecha',
    Header: t('date'),
    accessor: 'fecha',
    width: 120,
    minWidth: 100,
    maxWidth: 160,
    canResize: true,
    type: 'date'
  },
  {
    id: 'hora',
    Header: t('time'),
    accessor: 'fecha',
    width: 100,
    minWidth: 80,
    maxWidth: 120,
    canResize: true,
    type: 'time'
  },
  {
    id: 'duracion',
    Header: t('duracion'),
    accessor: 'duracion',
    width: 100,
    minWidth: 80,
    maxWidth: 140,
    canResize: true,
    type: 'number'
  },
  {
    id: 'tips',
    Header: t('description'),
    accessor: 'tips',
    width: 250,
    minWidth: 200,
    maxWidth: 400,
    canResize: true,
    type: 'tips'
  },
  {
    id: 'tags',
    Header: t('labels'),
    accessor: 'tags',
    width: 180,
    minWidth: 150,
    maxWidth: 300,
    canResize: true,
    type: 'tags'
  },
  {
    id: 'attachments',
    Header: t('attachments'),
    accessor: 'attachments',
    width: 120,
    minWidth: 100,
    maxWidth: 150,
    canResize: true,
    type: 'attachments',
    canSort: false
  },
  {
    id: 'comments',
    Header: t('comments'),
    accessor: 'comments',
    width: 100,
    minWidth: 80,
    maxWidth: 120,
    canResize: true,
    type: 'comments',
    canSort: false
  }
];

// Opciones de botones por fila
const getRowActions = (task: any, optionsItineraryButtonBox: any[], handlers: any) => {
  const actions = [
    {
      value: "edit",
      icon: <Edit2 className="w-4 h-4" />,
      title: "Editar tarea",
      onClick: () => handlers.handleEdit(task),
      className: 'text-gray-400 hover:text-primary'
    },
    {
      value: "visibility",
      icon: task.spectatorView ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
      title: task.spectatorView ? "Visible" : "Oculta",
      onClick: () => handlers.handleToggleVisibility(task),
      className: task.spectatorView ? 'text-primary' : 'text-gray-400'
    },
    {
      value: "lock",
      icon: task.estatus ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />,
      title: task.estatus ? "Bloqueada" : "Desbloqueada",
      onClick: () => handlers.handleToggleLock(task),
      className: task.estatus ? 'text-red-500' : 'text-gray-400'
    },
    {
      value: "duplicate",
      icon: <Copy className="w-4 h-4" />,
      title: "Duplicar",
      onClick: () => handlers.handleDuplicate(task),
      className: 'text-gray-400 hover:text-primary'
    },
    {
      value: "link",
      icon: <Link className="w-4 h-4" />,
      title: "Copiar enlace",
      onClick: () => handlers.handleCopyLink(task),
      className: 'text-gray-400 hover:text-primary'
    },
    ...(optionsItineraryButtonBox || []).filter(opt =>
      !['estatus', 'status'].includes(opt.value)
    )
  ];

  return actions;
};

export const TableView: React.FC<TableProps> = ({
  data,
  itinerario,
  selectTask,
  setSelectTask,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}) => {
  const { t } = useTranslation();
  const { config, user } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Definir columnas usando useMemo
  const columns = useMemo(() => defineColumns(t), [t]);

  // Estado de la tabla
  const [tableState, setTableState] = useState<TableState>(() => ({
    columns: columns,
    hiddenColumns: [],
    pinnedColumns: { left: [], right: [] },
    sortBy: [],
    filters: [],
    globalFilter: '',
    selectedRows: []
  }));

  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [savedViews, setSavedViews] = useState<ViewConfig[]>([]);
  const [showCommentModal, setShowCommentModal] = useState<{ show: boolean; task?: any; rowIndex?: number }>({ show: false });
  const [showEditModal, setShowEditModal] = useState<{ show: boolean; task?: any }>({ show: false });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Forzar actualización cuando cambian los datos
  const [forceUpdate, setForceUpdate] = useState(0);

  // Cargar vistas guardadas desde localStorage
  useEffect(() => {
    const savedViewsKey = `tableViews_${event._id}_${itinerario._id}`;
    const saved = localStorage.getItem(savedViewsKey);
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved views:', e);
      }
    }
  }, [event._id, itinerario._id]);

  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [data]);

  // Filtrar datos mejorado
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    let filtered = [...data];

    // Aplicar filtros
    const activeFilters = tableState.filters.filter(f => f.isActive && f.value);

    if (activeFilters.length > 0) {
      filtered = filtered.filter(item => {
        return activeFilters.every(filter => {
          const value = item[filter.columnId];
          const filterValue = filter.value;

          // Convertir valores a string para comparación
          const valueStr = String(value || '').toLowerCase();
          const filterStr = String(filterValue || '').toLowerCase();

          switch (filter.operator) {
            case 'contains':
              return valueStr.includes(filterStr);
            case 'equals':
              return valueStr === filterStr;
            case 'startsWith':
              return valueStr.startsWith(filterStr);
            case 'endsWith':
              return valueStr.endsWith(filterStr);
            case 'gt':
              return Number(value || 0) > Number(filterValue || 0);
            case 'lt':
              return Number(value || 0) < Number(filterValue || 0);
            case 'gte':
              return Number(value || 0) >= Number(filterValue || 0);
            case 'lte':
              return Number(value || 0) <= Number(filterValue || 0);
            case 'in':
              if (Array.isArray(filterValue)) {
                return filterValue.some(fv =>
                  String(fv).toLowerCase() === valueStr
                );
              }
              return false;
            case 'notIn':
              if (Array.isArray(filterValue)) {
                return !filterValue.some(fv =>
                  String(fv).toLowerCase() === valueStr
                );
              }
              return true;
            default:
              return true;
          }
        });
      });
    }

    // Aplicar búsqueda global mejorada
    if (tableState.globalFilter) {
      const searchTerm = tableState.globalFilter.toLowerCase();
      filtered = filtered.filter(item => {
        // Buscar en todos los campos, incluyendo arrays
        return Object.entries(item).some(([key, value]) => {
          if (value === null || value === undefined) return false;

          if (Array.isArray(value)) {
            // Para arrays, buscar en cada elemento
            return value.some(v =>
              String(v).toLowerCase().includes(searchTerm)
            );
          }

          // Para valores simples
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    return filtered;
  }, [data, tableState.filters, tableState.globalFilter, forceUpdate]);

  // Configurar react-table
  const tableInstance = useTable(
    {
      columns: useMemo(() => {
        if (!tableState.columns) return columns;
        return tableState.columns.filter(
          col => !tableState.hiddenColumns.includes(col.id)
        );
      }, [tableState.columns, tableState.hiddenColumns, columns]),
      data: filteredData,
      initialState: {
        sortBy: tableState.sortBy,
        hiddenColumns: tableState.hiddenColumns
      }
    },
    useGlobalFilter,
    useSortBy,
    useRowSelect
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = tableInstance;

  // Manejar actualización de celda mejorada con verificación de cambios
  const handleCellUpdate = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    const task = filteredData[rowIndex];
    if (!task) return;

    // Verificar si el valor realmente cambió
    const currentValue = task[columnId];

    // Comparación profunda para arrays
    if (Array.isArray(currentValue) && Array.isArray(value)) {
      if (JSON.stringify(currentValue) === JSON.stringify(value)) {
        return; // No hay cambios
      }
    } else if (currentValue === value) {
      return; // No hay cambios
    }

    try {
      let processedValue = value;
      let actualColumnId = columnId;

      // Procesar según el tipo de columna
      switch (columnId) {
        case 'responsable':
        case 'tags':
        case 'attachments':
          processedValue = JSON.stringify(Array.isArray(value) ? value : []);
          break;
        case 'tips':
          processedValue = String(value || '');
          break;
        case 'duracion':
          processedValue = String(value || '0');
          break;
        case 'fecha':
          if (value) {
            if (value instanceof Date) {
              processedValue = value.toISOString();
            } else if (typeof value === 'string') {
              // Verificar si es una fecha válida
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                processedValue = date.toISOString();
              } else {
                toast('error', t('Fecha inválida'));
                return;
              }
            }
          } else {
            // Si se borra la fecha, establecer fecha actual
            processedValue = new Date().toISOString();
          }
          break;
        case 'hora':
          // Para la hora, actualizamos la fecha completa
          if (task.fecha && value) {
            const fecha = new Date(task.fecha);
            const [hours, minutes] = value.split(':');
            fecha.setHours(parseInt(hours), parseInt(minutes));
            processedValue = fecha.toISOString();
            actualColumnId = 'fecha';
          }
          break;
        case 'estatus':
        case 'spectatorView':
          processedValue = JSON.stringify(Boolean(value));
          break;
        case 'estado':
        case 'prioridad':
          processedValue = String(value);
          break;
        default:
          processedValue = String(value || '');
      }

      // Hacer la llamada a la API
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          taskID: task._id,
          variable: actualColumnId,
          valor: processedValue
        },
        domain: config.domain
      });

      // Actualizar el estado local
      const updatedValue = ['responsable', 'tags', 'attachments'].includes(columnId)
        ? (Array.isArray(value) ? value : [])
        : value;

      // Actualizar a través del callback padre
      await onTaskUpdate(task._id, { [columnId]: updatedValue });

      // Forzar actualización de la tabla
      setForceUpdate(prev => prev + 1);

      toast('success', t('Campo actualizado'));

    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      toast('error', t('Error al actualizar la tarea'));
    }
  }, [event._id, itinerario._id, filteredData, onTaskUpdate, config.domain, t, toast]);

  // Primero definimos la validación de la respuesta
  const isValidTaskResponse = (response: unknown): response is Task => {
    return (
      typeof response === 'object' &&
      response !== null &&
      '_id' in response &&
      typeof (response as any)._id === 'string' &&
      'descripcion' in response &&
      typeof (response as any).descripcion === 'string'
    );
  };

  // Manejar creación de tarea mejorada
  const handleAddTask = async () => {
    try {
      // Calcular fecha por defecto
      const currentDate = new Date();
      const eventDate = event.fecha ? new Date(event.fecha) : currentDate;

      let defaultDate = eventDate;
      if (data && data.length > 0) {
        const lastTask = data[data.length - 1];
        if (lastTask.fecha) {
          const lastDate = new Date(lastTask.fecha);
          defaultDate = new Date(lastDate.getTime() + (lastTask.duracion || 30) * 60000);
        }
      }

      // Formatear fecha para el API
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const hours = String(defaultDate.getHours()).padStart(2, '0');
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0');

      // Hacer la petición con type assertion seguro
      const apiResponse = await fetchApiEventos({
        query: queries.createTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerario._id,
          descripcion: t('Nueva tarea'),
          fecha: `${year}-${month}-${day}`,
          hora: `${hours}:${minutes}`,
          duracion: 30
        },
        domain: config.domain
      });

      // Validar la respuesta usando el type guard
      if (isValidTaskResponse(apiResponse)) {
        // Construir una tarea completa con los valores por defecto
        const newTask: Task = {
          _id: apiResponse._id,
          fecha: new Date(`${year}-${month}-${day}T${hours}:${minutes}`),
          icon: '',
          descripcion: apiResponse.descripcion,
          duracion: apiResponse.duracion || 30,
          estado: 'pending',
          estatus: false,
          spectatorView: true,
          responsable: [],
          tags: [],
          tips: '',
          attachments: [],
          comments: [],
          commentsViewers: [],
          prioridad: 'media'
        };

        // Actualizar estado global
        setEvent((oldEvent) => {
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array.findIndex(
            it => it._id === itinerario._id
          );

          if (itineraryIndex > -1) {
            if (!newEvent.itinerarios_array[itineraryIndex].tasks) {
              newEvent.itinerarios_array[itineraryIndex].tasks = [];
            }
            newEvent.itinerarios_array[itineraryIndex].tasks.push(newTask);
          }

          return newEvent;
        });

        setSelectTask(newTask._id);
        toast('success', t('Tarea creada correctamente'));
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      toast('error', t('Error al crear la tarea'));
    }
  };

  // Funciones de exportación e importación
  const handleExport = () => {
    try {
      // Preparar datos para exportar
      const exportData = filteredData.map(task => ({
        [t('Título')]: task.descripcion || '',
        [t('Estado')]: task.estado || 'pending',
        [t('Prioridad')]: task.prioridad || 'media',
        [t('Responsables')]: Array.isArray(task.responsable) ? task.responsable.join(', ') : '',
        [t('Fecha')]: task.fecha ? new Date(task.fecha).toLocaleDateString() : '',
        [t('Hora')]: task.fecha ? new Date(task.fecha).toLocaleTimeString() : '',
        [t('Duración (min)')]: task.duracion || 0,
        [t('Descripción')]: task.tips || '',
        [t('Etiquetas')]: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        [t('Visible')]: task.spectatorView ? 'Sí' : 'No',
        [t('Bloqueada')]: task.estatus ? 'Sí' : 'No'
      }));

      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tareas');

      // Generar archivo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });

      // Descargar archivo
      const fileName = `${itinerario.title}_tareas_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(blob, fileName);

      toast('success', t('Datos exportados correctamente'));
    } catch (error) {
      console.error('Error al exportar:', error);
      toast('error', t('Error al exportar los datos'));
    }
  };

  const handleImport = () => {
    // Crear input file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const reader = new FileReader();

        reader.onload = async (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Procesar cada fila e importar
            for (const row of data as any[]) {
              const fecha = row[t('Fecha')] ? new Date(row[t('Fecha')]) : new Date();
              const [hours, minutes] = (row[t('Hora')] || '00:00').split(':');
              fecha.setHours(parseInt(hours), parseInt(minutes));

              await fetchApiEventos({
                query: queries.createTask,
                variables: {
                  eventID: event._id,
                  itinerarioID: itinerario._id,
                  descripcion: row[t('Título')] || t('Tarea importada'),
                  fecha: fecha.toISOString().split('T')[0],
                  hora: `${hours}:${minutes}`,
                  duracion: parseInt(row[t('Duración (min)')] || '30')
                },
                domain: config.domain
              });
            }

            // Recargar datos
            window.location.reload();

            toast('success', t('Datos importados correctamente'));
          } catch (error) {
            console.error('Error procesando archivo:', error);
            toast('error', t('Error al procesar el archivo'));
          }
        };

        reader.readAsBinaryString(file);
      } catch (error) {
        console.error('Error al importar:', error);
        toast('error', t('Error al importar los datos'));
      }
    };

    input.click();
  };

  // Toggle columnas
  const handleToggleColumn = useCallback((columnId: string) => {
    setTableState(prev => ({
      ...prev,
      hiddenColumns: prev.hiddenColumns.includes(columnId)
        ? prev.hiddenColumns.filter(id => id !== columnId)
        : [...prev.hiddenColumns, columnId]
    }));
  }, []);

  // Manejar filtros
  const handleFiltersChange = (filters: TableFilter[]) => {
    setTableState(prev => ({ ...prev, filters }));
  };

  // Guardar vista mejorada
  const handleSaveView = (view: ViewConfig) => {
    const newViews = [...savedViews, view];
    setSavedViews(newViews);

    // Guardar en localStorage
    const savedViewsKey = `tableViews_${event._id}_${itinerario._id}`;
    localStorage.setItem(savedViewsKey, JSON.stringify(newViews));

    // TODO: Guardar en base de datos
    // Agregar campo viewConfigs al itinerario en la base de datos

    toast('success', 'Vista guardada correctamente');
  };

  // Cargar vista
  const handleLoadView = (view: ViewConfig) => {
    setTableState(prev => ({
      ...prev,
      columns: view.columns,
      filters: view.filters,
      sortBy: view.sortBy,
      hiddenColumns: view.columns
        .filter(col => col.isHidden)
        .map(col => col.id)
    }));
    toast('success', `Vista "${view.name}" cargada`);
  };

  // Manejar click en comentarios
  const handleCommentsClick = (task: any, rowIndex: number) => {
    setShowCommentModal({ show: true, task, rowIndex });
  };

  // Actualizar comentarios
  const handleUpdateComments = async (taskId: string, comments: any[]) => {
    await onTaskUpdate(taskId, { comments });
    setForceUpdate(prev => prev + 1);
  };

  // Handlers para acciones de fila
  const rowActionHandlers = {
    handleEdit: (task: any) => {
      setShowEditModal({ show: true, task });
    },
    handleToggleVisibility: async (task: any) => {
      await handleCellUpdate(
        filteredData.findIndex(t => t._id === task._id),
        'spectatorView',
        !task.spectatorView
      );
    },
    handleToggleLock: async (task: any) => {
      await handleCellUpdate(
        filteredData.findIndex(t => t._id === task._id),
        'estatus',
        !task.estatus
      );
    },
    handleDuplicate: async (task: any) => {
      try {
        const apiResponse = await fetchApiEventos({
          query: queries.createTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            descripcion: `${task.descripcion} (copia)`,
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().substring(0, 5),
            duracion: task.duracion || 30,
            variable: "estado",
            valor: task.estado || "pending"
          },
          domain: config.domain
        });

        if (isValidTaskResponse(apiResponse)) {
          // Construir la nueva tarea con todos los campos necesarios
          const newTask: Task = {
            _id: apiResponse._id,
            fecha: new Date(apiResponse.fecha),
            icon: task.icon || '',
            descripcion: apiResponse.descripcion,
            duracion: apiResponse.duracion || task.duracion || 30,
            estado: task.estado || 'pending',
            estatus: false,
            spectatorView: true,
            responsable: [...(task.responsable || [])],
            tags: [...(task.tags || [])],
            tips: task.tips || '',
            attachments: [],
            comments: [],
            commentsViewers: [],
            prioridad: task.prioridad || 'media'
          };

          // Actualizar el estado global
          setEvent((prevEvent) => {
            const newEvent = { ...prevEvent };
            const itineraryIndex = newEvent.itinerarios_array.findIndex(
              it => it._id === itinerario._id
            );

            if (itineraryIndex > -1) {
              if (!newEvent.itinerarios_array[itineraryIndex].tasks) {
                newEvent.itinerarios_array[itineraryIndex].tasks = [];
              }
              newEvent.itinerarios_array[itineraryIndex].tasks.push(newTask);
            }

            return newEvent;
          });

          // Actualizar la vista
          setForceUpdate(prev => prev + 1);
          toast('success', t('Tarea duplicada correctamente'));
        } else {
          throw new Error('Respuesta inválida del servidor');
        }
      } catch (error) {
        console.error('Error al duplicar tarea:', error);
        toast('error', t('Error al duplicar la tarea'));
      }
    },


    handleCopyLink: useCallback(async (task: any) => {
      const link = `${window.location.origin}/services/servicios-${event._id}-${itinerario._id}-${task._id}`;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(link);
          toast('success', t('Enlace copiado'));
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = link;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            toast('success', t('Enlace copiado'));
          } catch (err) {
            console.error('Error al copiar:', err);
            toast('error', t('Error al copiar el enlace'));
          } finally {
            textArea.remove();
          }
        }
      } catch (error) {
        console.error('Error al copiar enlace:', error);
        toast('error', t('Error al copiar el enlace'));
      }
    }, [event._id, itinerario._id, t, toast])

  };

  const activeFiltersCount = tableState.filters.filter(f => f.isActive && f.value).length;

  if (!tableState.columns) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Header principal - fixed para evitar solapamiento */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <TableHeader
          title={`${itinerario.title} - Vista Tabla`}
          totalItems={data.length}
          selectedItems={tableState.selectedRows.length}
          searchValue={tableState.globalFilter}
          onSearchChange={(value) => setTableState(prev => ({ ...prev, globalFilter: value }))}
          onAddTask={handleAddTask}
          onExport={handleExport}
          onImport={handleImport}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          columns={tableState.columns}
          hiddenColumns={tableState.hiddenColumns}
          onToggleColumn={handleToggleColumn}
          onFiltersToggle={() => setShowFilters(!showFilters)}
          filtersActive={activeFiltersCount > 0}
        />
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="sticky top-[73px] z-20 bg-white shadow-sm">
          <TableFilters
            filters={tableState.filters}
            columns={tableState.columns}
            onFiltersChange={handleFiltersChange}
            onSaveView={handleSaveView}
            savedViews={savedViews}
            onLoadView={handleLoadView}
          />
        </div>
      )}

      {/* Tabla principal con contenedor de scroll */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto relative">
        <div className="min-w-full">
          <table {...getTableProps()} className="w-full bg-white relative">
            {/* Header de la tabla */}
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {headerGroups.map((headerGroup, headerGroupIndex) => (
                <tr
                  key={`header-group-${headerGroupIndex}`}
                  {...headerGroup.getHeaderGroupProps()}
                  className="divide-x divide-gray-200"
                >
                  {headerGroup.headers.map((column, columnIndex) => {
                    return (
                      <th
                        key={`header-${column.id || columnIndex}`}
                        {...column.getHeaderProps()}
                        className="group relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            {...(column.canSort ? column.getSortByToggleProps() : {})}
                            className={`flex items-center space-x-1 ${column.canSort ? 'cursor-pointer' : ''}`}
                          >
                            <span>{column.render('Header')}</span>
                            {column.isSorted && (
                              <span className="text-primary">
                                {column.isSortedDesc ? '↓' : '↑'}
                              </span>
                            )}
                          </div>

                          {column.id !== 'select' && (
                            <ColumnMenu
                              column={column as any}
                              onSort={(direction) => console.log('Sort', direction)}
                              onFilter={() => console.log('Filter')}
                              onHide={() => handleToggleColumn(column.id)}
                              onPin={(position) => console.log('Pin', position)}
                              onResize={() => console.log('Resize')}
                              onInsertLeft={() => console.log('Insert left')}
                              onInsertRight={() => console.log('Insert right')}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Body de la tabla */}
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => {
                prepareRow(row);
                const isSelected = selectTask === row.original._id;
                const isHovered = hoveredRow === row.original._id;

                return (
                  <tr
                    key={row.original._id || `row-${rowIndex}`}
                    {...row.getRowProps()}
                    className={`
                      relative hover:bg-gray-50 transition-colors divide-x divide-gray-200
                      ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : ''}
                    `}
                    onClick={() => setSelectTask(row.original._id)}
                    onMouseEnter={() => {
                      setHoveredRow(row.original._id);
                    }}
                    onMouseLeave={() => {
                      setHoveredRow(null);
                    }}
                  >
                    {row.cells.map((cell, cellIndex) => {
                      return (
                        <td
                          key={`${row.original._id}-${cell.column.id || cellIndex}`}
                          {...cell.getCellProps()}
                          className="px-0 py-0 whitespace-nowrap overflow-visible relative"
                          style={{
                            width: cell.column.width,
                            minWidth: cell.column.minWidth,
                            maxWidth: cell.column.maxWidth
                          }}
                        >
                          {/* Barra de acciones flotante - Solo en la primera columna */}
                          {cellIndex === 0 && hoveredRow === row.original._id && (
                            <div
                              className="absolute -top-0 left-0 z-50 pointer-events-none"
                              style={{ transform: 'translateY(-100%)' }}
                            >
                              <div
                                className="flex items-center bg-white border border-gray-200 rounded-lg shadow-lg p-1 space-x-1 pointer-events-auto"
                                onMouseEnter={() => setHoveredRow(row.original._id)}
                                onMouseLeave={() => setHoveredRow(null)}
                              >
                                {getRowActions(row.original, [], rowActionHandlers).map((action, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick();
                                    }}
                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${action.className || ''}`}
                                    title={t(action.title)}
                                  >
                                    {action.icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <TableCell
                            column={cell.column as any}
                            row={row}
                            value={cell.value}
                            task={row.original}
                            onUpdate={(value) => handleCellUpdate(rowIndex, cell.column.id, value)}
                            isEditing={editingCell?.row === rowIndex && editingCell?.column === cell.column.id}
                            onStartEdit={() => setEditingCell({ row: rowIndex, column: cell.column.id })}
                            onStopEdit={() => setEditingCell(null)}
                            onCommentsClick={() => handleCommentsClick(row.original, rowIndex)}
                            itinerarioId={itinerario._id}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mensaje cuando no hay datos */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {data.length === 0 ? (
                  <div>
                    <p className="text-lg mb-2">{t('No hay tareas todavía')}</p>
                    <p className="text-sm">{t('Crea tu primera tarea para comenzar')}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">{t('No se encontraron resultados')}</p>
                    <p className="text-sm">{t('Intenta ajustar tus filtros o búsqueda')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer con información */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {t('Mostrando')} {filteredData.length} {t('de')} {data.length} {t('tareas')}
          </div>
          <div className="flex items-center space-x-4">
            {tableState.selectedRows.length > 0 && (
              <span className="font-medium text-primary">
                {tableState.selectedRows.length} {t('seleccionadas')}
              </span>
            )}
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {activeFiltersCount} {t('filtros activos')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal de comentarios con z-index alto */}
      {showCommentModal.show && showCommentModal.task && (
        <div className="fixed inset-0 z-50">
          <CommentModal
            task={showCommentModal.task}
            itinerario={itinerario}
            onClose={() => setShowCommentModal({ show: false })}
            onUpdateComments={handleUpdateComments}
          />
        </div>
      )}

      {/* Modal de edición con z-index más alto y estructura corregida */}
      {showEditModal.show && showEditModal.task && (
        <>
          {/* Backdrop para bloquear interacciones */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={() => setShowEditModal({ show: false })} />

          {/* Modal container con z-index superior */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto">
              <TableEditModal
                task={showEditModal.task}
                itinerario={itinerario}
                onClose={() => setShowEditModal({ show: false })}
                onSave={async (taskId, updates) => {
                  await onTaskUpdate(taskId, updates);
                  setShowEditModal({ show: false });
                  setForceUpdate(prev => prev + 1);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};