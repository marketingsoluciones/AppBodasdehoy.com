import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, FileImage, FileVideo, FileAudio, File, Check, Loader2, Download, Trash2, Lock, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStorage, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { FileData } from '../../../utils/Interfaces';
import { customAlphabet } from "nanoid";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { downloadFile } from "../../Utils/storages";
import { useToast } from "../../../hooks/useToast";

interface Props {
  attachments: FileData[];
  onUpdate: (attachments: FileData[]) => void;
  taskId: string;
  eventId: string;
  itinerarioId: string;
  readOnly?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return <FileImage className="w-4 h-4 text-primary" />;
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
    return <FileVideo className="w-4 h-4 text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
    return <FileAudio className="w-4 h-4 text-green-500" />;
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  
  return <File className="w-4 h-4 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const NewAttachmentsEditor: React.FC<Props> = ({
  attachments,
  onUpdate,
  taskId,
  eventId,
  itinerarioId,
  readOnly = false
}) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const storage = getStorage();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<string[]>([]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Verificar archivos duplicados
    const existingNames = attachments.map(a => a.name);
    const duplicates = filesArray.filter(file => existingNames.includes(file.name));
    
    if (duplicates.length > 0) {
      toast("error", t(`Archivos duplicados: ${duplicates.map(f => f.name).join(', ')}`));
      return;
    }

    // Subir archivos
    filesArray.forEach(file => {
      const uploadId = customAlphabet('1234567890abcdef', 24)();
      
      setUploadingFiles(prev => [...prev, {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading'
      }]);

      // IMPORTANTE: Usar doble barra como en InputAttachments
      const storageRef = ref(storage, `${taskId}//${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          setUploadingFiles(prev => prev.map(uf => 
            uf.id === uploadId ? { ...uf, progress } : uf
          ));
        },
        (error) => {
          console.error('Error uploading file:', error);
          
          setUploadingFiles(prev => prev.map(uf => 
            uf.id === uploadId ? { ...uf, status: 'error' } : uf
          ));
          
          toast("error", t(`Error al subir ${file.name}`));
          
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadId));
          }, 3000);
        },
        async () => {
          // Archivo subido exitosamente
          const newFileData: FileData = {
            _id: customAlphabet('1234567890abcdef', 24)(),
            name: file.name,
            size: file.size,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const newAttachments = [...attachments, newFileData];
          
          try {
            // IMPORTANTE: Actualizar la tarea completa como en InputAttachments
            const currentItinerary = event.itinerarios_array.find(it => it._id === itinerarioId);
            const currentTask = currentItinerary?.tasks.find(t => t._id === taskId);
            
            if (!currentTask) {
              throw new Error('Task not found');
            }

            // Actualizar con la estructura completa de la tarea
            const updatedTask = {
              ...currentTask,
              attachments: newAttachments
            };

            await fetchApiEventos({
              query: queries.editTask,
              variables: {
                eventID: eventId,
                itinerarioID: itinerarioId,
                taskID: taskId,
                variable: "all", // IMPORTANTE: Usar "all" como en InputAttachments
                valor: JSON.stringify(updatedTask)
              },
              domain: config.domain
            });

            // Actualizar estado local
            onUpdate(newAttachments);
            
            // Actualizar el evento global
            setEvent((oldEvent) => {
              if (!oldEvent) return oldEvent;
              const newEvent = { ...oldEvent };
              const itineraryIndex = newEvent.itinerarios_array?.findIndex(it => it._id === itinerarioId);
              if (itineraryIndex !== undefined && itineraryIndex > -1) {
                const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks?.findIndex(t => t._id === taskId);
                if (taskIndex !== undefined && taskIndex > -1) {
                  newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].attachments = newAttachments;
                }
              }
              return newEvent;
            });
            
            setUploadingFiles(prev => prev.map(uf => 
              uf.id === uploadId ? { ...uf, status: 'success' } : uf
            ));
            
            toast("success", t("Archivo subido correctamente"));
            
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadId));
            }, 2000);
            
          } catch (error) {
            console.error('Error updating attachments:', error);
            
            // Si falla la actualización, eliminar el archivo del storage
            const deleteRef = ref(storage, `${taskId}//${file.name}`);
            await deleteObject(deleteRef).catch(() => {});
            
            setUploadingFiles(prev => prev.map(uf => 
              uf.id === uploadId ? { ...uf, status: 'error' } : uf
            ));
            
            toast("error", t("Error al actualizar adjuntos"));
            
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadId));
            }, 3000);
          }
        }
      );
    });
  };

  const handleDelete = async (file: FileData) => {
    if (!file.name) return;
    
    setDeletingFiles(prev => [...prev, file.name]);
    
    try {
      // Eliminar del storage con doble barra
      const storageRef = ref(storage, `${taskId}//${file.name}`);
      await deleteObject(storageRef).catch((error) => {
        console.log('Archivo no existe en storage o ya fue eliminado:', error);
      });

      // Actualizar lista de adjuntos
      const newAttachments = attachments.filter(a => a.name !== file.name);
      
      // Obtener la tarea actual
      const currentItinerary = event.itinerarios_array.find(it => it._id === itinerarioId);
      const currentTask = currentItinerary?.tasks.find(t => t._id === taskId);
      
      if (currentTask) {
        const updatedTask = {
          ...currentTask,
          attachments: newAttachments
        };

        await fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: eventId,
            itinerarioID: itinerarioId,
            taskID: taskId,
            variable: "all", // Usar "all" como en InputAttachments
            valor: JSON.stringify(updatedTask)
          },
          domain: config.domain
        });

        onUpdate(newAttachments);
        
        // Actualizar el evento global
        setEvent((oldEvent) => {
          if (!oldEvent) return oldEvent;
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array?.findIndex(it => it._id === itinerarioId);
          if (itineraryIndex !== undefined && itineraryIndex > -1) {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks?.findIndex(t => t._id === taskId);
            if (taskIndex !== undefined && taskIndex > -1) {
              newEvent.itinerarios_array[itineraryIndex].tasks[taskIndex].attachments = newAttachments;
            }
          }
          return newEvent;
        });
        
        toast("success", t("Archivo eliminado"));
      }
      
    } catch (error) {
      console.error('Error deleting file:', error);
      toast("error", t("Error al eliminar archivo"));
    } finally {
      setDeletingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const handleDownload = async (file: FileData) => {
    try {
      // Usar doble barra en la ruta
      await downloadFile(storage, `${taskId}//${file.name}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast("error", t("Error al descargar archivo"));
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className="space-y-3">
      {/* Header con título y botón de agregar */}
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {t('Archivos adjuntos')} 
          <span className="text-xs text-gray-500">({attachments.length})</span>
          {readOnly && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              {t('Solo lectura')}
            </span>
          )}
        </h5>
        
        {/* Botón de agregar archivo - Más compacto */}
        {!readOnly && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                isDragging 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isDragging ? (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {t('Suelta aquí')}
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  {t('Agregar archivo')}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Archivos subiendo - Más compacto */}
      {!readOnly && uploadingFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadingFiles.map(uf => (
            <div key={uf.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              {uf.status === 'uploading' ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
              ) : uf.status === 'success' ? (
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{uf.file.name}</p>
                <div className="mt-0.5 w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      uf.status === 'success' 
                        ? 'bg-green-500' 
                        : uf.status === 'error' 
                        ? 'bg-red-500' 
                        : 'bg-primary'
                    }`}
                    style={{ width: `${uf.progress}%` }}
                  />
                </div>
              </div>
              
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatFileSize(uf.file.size)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de archivos - Diseño más compacto */}
      {attachments.length > 0 ? (
        <div className="space-y-1">
          {attachments.map((file) => (
            <div
              key={file._id || file.name}
              className={`group flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors ${
                deletingFiles.includes(file.name) ? 'opacity-50' : ''
              }`}
            >
              {getFileIcon(file.name)}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1 text-gray-500 hover:text-primary rounded"
                  title={t('Descargar')}
                  disabled={deletingFiles.includes(file.name)}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 text-gray-500 hover:text-red-500 rounded"
                    title={t('Eliminar')}
                    disabled={deletingFiles.includes(file.name)}
                  >
                    {deletingFiles.includes(file.name) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado vacío - Mucho más compacto */
        !readOnly && (
          <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border border-dashed rounded-md p-3 text-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300'
            }`}
          >
            <p className="text-xs text-gray-500">
              {isDragging ? (
                <span className="text-primary font-medium">{t('Suelta los archivos aquí')}</span>
              ) : (
                <>
                  {t('Arrastra archivos o')}{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {t('haz clic aquí')}
                  </button>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('Máx: 10MB')}
            </p>
          </div>
        )
      )}
    </div>
  );
};