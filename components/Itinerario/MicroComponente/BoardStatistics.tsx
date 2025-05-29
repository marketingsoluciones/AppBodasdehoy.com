import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';

interface BoardStatisticsProps {
  tasks: Task[];
  columns: any[];
  onClose?: () => void;
}

export const BoardStatistics: React.FC<BoardStatisticsProps> = ({ 
  tasks, 
  columns,
  onClose 
}) => {
  const { t } = useTranslation();

  const statistics = useMemo(() => {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.estatus === true).length;
    const overdueTasks = tasks.filter(t => {
      if (!t.fecha || t.estatus) return false;
      return new Date(t.fecha) < now;
    }).length;
    
    const tasksWithResponsible = tasks.filter(t => t.responsable && t.responsable.length > 0).length;
    const highPriorityTasks = tasks.filter(t => t.prioridad === 'alta').length;
    const mediumPriorityTasks = tasks.filter(t => t.prioridad === 'media').length;
    const lowPriorityTasks = tasks.filter(t => t.prioridad === 'baja').length;
    
    // Calcular productividad (tareas completadas en los últimos 7 días)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = tasks.filter(t => {
      if (!t.fecha || !t.estatus) return false;
      const taskDate = new Date(t.fecha);
      return taskDate >= sevenDaysAgo && taskDate <= now;
    }).length;
    
    // Calcular tiempo promedio de completado
    const avgCompletionTime = tasks
      .filter(t => t.estatus && t.duracion)
      .reduce((acc, t) => acc + (t.duracion || 0), 0) / (completedTasks || 1);
    
    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      overdueTasks,
      tasksWithResponsible,
      assignmentRate: totalTasks > 0 ? (tasksWithResponsible / totalTasks) * 100 : 0,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      recentlyCompleted,
      avgCompletionTime,
      productivityTrend: recentlyCompleted > 5
        ? 'up'
        : recentlyCompleted > 2
        ? 'stable'
        : 'down' as 'up' | 'stable' | 'down'
    };
  }, [tasks]);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-pink-50 text-primary border-pink-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      amber: 'bg-amber-50 text-amber-600 border-amber-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      gray: 'bg-gray-50 text-gray-600 border-gray-200'
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]} transition-all hover:shadow-md`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs opacity-70 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-white bg-opacity-50">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center space-x-1">
            {trend === 'up' && (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">{t('Mejorando')}</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600">{t('Bajando')}</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">{t('Estable')}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span>{t('Estadísticas del Tablero')}</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('Resumen de rendimiento y productividad')}
        </p>
      </div>

      {/* Grid de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t('Tasa de Completado')}
          value={`${Math.round(statistics.completionRate)}%`}
          subtitle={`${statistics.completedTasks} de ${statistics.totalTasks} tareas`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
          trend={statistics.completionRate > 70 ? 'up' : statistics.completionRate > 40 ? 'stable' : 'down'}
        />
        
        <StatCard
          title={t('Tareas Vencidas')}
          value={statistics.overdueTasks}
          subtitle={statistics.overdueTasks > 0 ? t('Requieren atención inmediata') : t('Todo al día')}
          icon={<AlertCircle className="w-6 h-6" />}
          color={statistics.overdueTasks > 0 ? 'red' : 'green'}
        />
        
        <StatCard
          title={t('Productividad Semanal')}
          value={statistics.recentlyCompleted}
          subtitle={t('Tareas completadas en 7 días')}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
          trend={statistics.productivityTrend}
        />
        
        <StatCard
          title={t('Tasa de Asignación')}
          value={`${Math.round(statistics.assignmentRate)}%`}
          subtitle={`${statistics.tasksWithResponsible} tareas asignadas`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        
        <StatCard
          title={t('Tiempo Promedio')}
          value={`${Math.round(statistics.avgCompletionTime)} min`}
          subtitle={t('Por tarea completada')}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
        />
        
        <StatCard
          title={t('Total de Tareas')}
          value={statistics.totalTasks}
          subtitle={`${columns.length} columnas activas`}
          icon={<Target className="w-6 h-6" />}
          color="gray"
        />
      </div>

      {/* Distribución por prioridad */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Distribución por Prioridad')}</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-20">{t('Alta')}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-red-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${statistics.totalTasks > 0 ? (statistics.highPriorityTasks / statistics.totalTasks) * 100 : 0}%` }}
              >
                <span className="text-xs text-white font-medium">{statistics.highPriorityTasks}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-20">{t('Media')}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-yellow-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${statistics.totalTasks > 0 ? (statistics.mediumPriorityTasks / statistics.totalTasks) * 100 : 0}%` }}
              >
                <span className="text-xs text-white font-medium">{statistics.mediumPriorityTasks}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-20">{t('Baja')}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-green-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${statistics.totalTasks > 0 ? (statistics.lowPriorityTasks / statistics.totalTasks) * 100 : 0}%` }}
              >
                <span className="text-xs text-white font-medium">{statistics.lowPriorityTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-primary mb-2">{t('Insights')}</h4>
        <ul className="space-y-1 text-sm text-primary">
          {statistics.completionRate < 50 && (
            <li>• {t('La tasa de completado está por debajo del 50%. Considera revisar las prioridades.')}</li>
          )}
          {statistics.overdueTasks > 5 && (
            <li>• {t('Hay varias tareas vencidas. Es importante atenderlas pronto.')}</li>
          )}
          {statistics.assignmentRate < 70 && (
            <li>• {t('Muchas tareas no tienen responsable asignado. Asigna responsables para mejor seguimiento.')}</li>
          )}
          {statistics.highPriorityTasks > statistics.totalTasks * 0.5 && (
            <li>• {t('Más del 50% de las tareas son de alta prioridad. Considera re-evaluar las prioridades.')}</li>
          )}
          {statistics.productivityTrend === 'up' && (
            <li className="text-green-700">• {t('¡Excelente! La productividad está mejorando.')}</li>
          )}
        </ul>
      </div>
    </div>
  );
};