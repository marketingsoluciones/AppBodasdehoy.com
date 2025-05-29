import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Task } from '../../../utils/Interfaces';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface ImportExportModalProps {
  tasks: Task[];
  columns: any[];
  onImport: (data: any) => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  tasks,
  columns,
  onImport,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [importData, setImportData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Función para exportar datos
  const handleExport = () => {
    setIsProcessing(true);
    
    try {
      let exportData: string;
      let fileName: string;
      let mimeType: string;

      const baseData = {
        exportDate: new Date().toISOString(),
        columns: columns.map(col => ({
          id: col.id,
          title: col.title,
          tasksCount: col.tasks.length
        })),
        tasks: tasks.map(task => ({
          id: task._id,
          descripcion: task.descripcion,
          estado: task.estado,
          estatus: task.estatus,
          prioridad: task.prioridad,
          responsable: task.responsable,
          fecha: task.fecha,
          duracion: task.duracion,
          tags: task.tags,
          tips: task.tips
        }))
      };

      switch (exportFormat) {
        case 'json':
          exportData = JSON.stringify(baseData, null, 2);
          fileName = `tablero-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          // Convertir a CSV
          const csvHeaders = ['ID', 'Descripción', 'Estado', 'Completado', 'Prioridad', 'Responsables', 'Fecha', 'Duración', 'Etiquetas'];
          const csvRows = tasks.map(task => [
            task._id,
            `"${task.descripcion.replace(/"/g, '""')}"`,
            task.estado,
            task.estatus ? 'Sí' : 'No',
            task.prioridad,
            task.responsable.join('; '),
            task.fecha ? new Date(task.fecha).toLocaleDateString() : '',
            task.duracion,
            task.tags.join('; ')
          ]);
          
          exportData = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
          fileName = `tablero-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'txt':
          // Convertir a texto plano
          exportData = `EXPORTACIÓN DE TABLERO\n`;
          exportData += `Fecha: ${new Date().toLocaleString()}\n`;
          exportData += `Total de tareas: ${tasks.length}\n\n`;
          
          columns.forEach(col => {
            exportData += `\n=== ${col.title.toUpperCase()} (${col.tasks.length} tareas) ===\n`;
            col.tasks.forEach((task: Task, index: number) => {
              exportData += `\n${index + 1}. ${task.descripcion}\n`;
              exportData += `   Estado: ${task.estatus ? 'Completado' : 'Pendiente'}\n`;
              exportData += `   Prioridad: ${task.prioridad}\n`;
              if (task.responsable.length > 0) {
                exportData += `   Responsables: ${task.responsable.join(', ')}\n`;
              }
              if (task.fecha) {
                exportData += `   Fecha: ${new Date(task.fecha).toLocaleDateString()}\n`;
              }
            });
          });
          
          fileName = `tablero-export-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
          
        default:
          throw new Error('Formato no soportado');
      }

      // Crear y descargar el archivo
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('Datos exportados correctamente'));
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error(t('Error al exportar los datos'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para manejar la importación
  const handleImport = () => {
    if (!importData.trim()) {
      toast.error(t('Por favor, pegue o cargue datos para importar'));
      return;
    }

    setIsProcessing(true);
    
    try {
      const parsedData = JSON.parse(importData);
      
      // Validar estructura básica
      if (!parsedData.tasks || !Array.isArray(parsedData.tasks)) {
        throw new Error('Formato de datos inválido');
      }
      
      // Mostrar vista previa
      setImportPreview({
        tasksCount: parsedData.tasks.length,
        columnsCount: parsedData.columns?.length || 0,
        exportDate: parsedData.exportDate
      });
      
      // Confirmar importación
      if (window.confirm(t(`¿Desea importar ${parsedData.tasks.length} tareas?`))) {
        onImport(parsedData);
        toast.success(t('Datos importados correctamente'));
        onClose();
      }
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error(t('Error al procesar los datos. Verifique el formato.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para manejar la carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      
      // Auto-detectar formato
      try {
        JSON.parse(content);
        toast.success(t('Archivo JSON cargado correctamente'));
      } catch {
        toast.info(t('Archivo cargado. Verifique el formato antes de importar.'));
      }
    };
    
    reader.readAsText(file);
  };

  // Plantilla de ejemplo
  const exampleTemplate = {
    exportDate: new Date().toISOString(),
    columns: [
      { id: "pending", title: "Pendiente", tasksCount: 2 }
    ],
    tasks: [
      {
        id: "task-1",
        descripcion: "Tarea de ejemplo",
        estado: "pending",
        estatus: false,
        prioridad: "media",
        responsable: ["Usuario 1"],
        fecha: new Date().toISOString(),
        duracion: 60,
        tags: ["ejemplo"],
        tips: "Descripción detallada"
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('Importar / Exportar Datos')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`
              flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-medium transition-colors
              ${activeTab === 'export' 
                ? 'text-primary border-b-2 border-primary bg-pink-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            <Download className="w-4 h-4" />
            <span>{t('Exportar')}</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`
              flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-medium transition-colors
              ${activeTab === 'import' 
                ? 'text-primary border-b-2 border-primary bg-pink-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            <Upload className="w-4 h-4" />
            <span>{t('Importar')}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Estadísticas de exportación */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-primary">{t('Datos a exportar')}</h4>
                    <p className="text-sm text-primary mt-1">
                      {tasks.length} tareas en {columns.length} columnas
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de formato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('Formato de exportación')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${exportFormat === 'json' 
                        ? 'border-primary bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <FileJson className={`w-8 h-8 mx-auto mb-2 ${exportFormat === 'json' ? 'text-primary' : 'text-gray-400'}`} />
                    <div className={`font-medium ${exportFormat === 'json' ? 'text-primary' : 'text-gray-700'}`}>JSON</div>
                    <div className="text-xs text-gray-500 mt-1">{t('Formato completo')}</div>
                  </button>
                  
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${exportFormat === 'csv' 
                        ? 'border-primary bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${exportFormat === 'csv' ? 'text-primary' : 'text-gray-400'}`} />
                    <div className={`font-medium ${exportFormat === 'csv' ? 'text-primary' : 'text-gray-700'}`}>CSV</div>
                    <div className="text-xs text-gray-500 mt-1">{t('Para Excel')}</div>
                  </button>
                  
                  <button
                    onClick={() => setExportFormat('txt')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${exportFormat === 'txt' 
                        ? 'border-primary bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${exportFormat === 'txt' ? 'text-primary' : 'text-gray-400'}`} />
                    <div className={`font-medium ${exportFormat === 'txt' ? 'text-primary' : 'text-gray-700'}`}>TXT</div>
                    <div className="text-xs text-gray-500 mt-1">{t('Texto plano')}</div>
                  </button>
                </div>
              </div>

              {/* Información del formato seleccionado */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  {t('Información del formato')} {exportFormat.toUpperCase()}
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {exportFormat === 'json' && (
                    <>
                      <li>• {t('Incluye toda la información de las tareas')}</li>
                      <li>• {t('Mantiene la estructura de columnas')}</li>
                      <li>• {t('Ideal para respaldos completos')}</li>
                    </>
                  )}
                  {exportFormat === 'csv' && (
                    <>
                      <li>• {t('Compatible con Excel y Google Sheets')}</li>
                      <li>• {t('Formato tabular simple')}</li>
                      <li>• {t('Ideal para análisis de datos')}</li>
                    </>
                  )}
                  {exportFormat === 'txt' && (
                    <>
                      <li>• {t('Formato legible para humanos')}</li>
                      <li>• {t('Organizado por columnas')}</li>
                      <li>• {t('Ideal para documentación')}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Área de importación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('Datos a importar')}
                </label>
                
                {/* Botones de acción */}
                <div className="flex space-x-3 mb-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t('Cargar archivo')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setImportData(JSON.stringify(exampleTemplate, null, 2));
                      toast.info(t('Plantilla de ejemplo cargada'));
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>{t('Ver plantilla')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(importData);
                      toast.success(t('Copiado al portapapeles'));
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={!importData}
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('Copiar')}</span>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={t('Pegue aquí los datos JSON o cargue un archivo...')}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Vista previa de importación */}
              {importPreview && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">{t('Vista previa')}</h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• {importPreview.tasksCount} tareas encontradas</li>
                        <li>• {importPreview.columnsCount} columnas definidas</li>
                        {importPreview.exportDate && (
                          <li>• Exportado el {new Date(importPreview.exportDate).toLocaleDateString()}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">{t('Importante')}</h4>
                    <ul className="text-sm text-amber-700 mt-1 space-y-1">
                      <li>• {t('Solo se acepta formato JSON')}</li>
                      <li>• {t('Las tareas se agregarán a las existentes')}</li>
                      <li>• {t('Verifique el formato antes de importar')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('Cancelar')}
          </button>
          
          {activeTab === 'export' ? (
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                ${isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary shadow-sm hover:shadow'
                }
              `}
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? t('Procesando...') : t('Exportar')}</span>
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={isProcessing || !importData.trim()}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                ${isProcessing || !importData.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary shadow-sm hover:shadow'
                }
              `}
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? t('Procesando...') : t('Importar')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};