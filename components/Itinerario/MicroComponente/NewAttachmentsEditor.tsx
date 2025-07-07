import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, FileImage, FileVideo, FileAudio, File, Check, Loader2, Download, Trash2, Lock } from 'lucide-react';
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
  readOnly?: boolean; // NUEVA PROP AGREGADA
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
    return <FileImage className="w-8 h-8 text-primary" />;
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
    return <FileVideo className="w-8 h-8 text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
    return <FileAudio className="w-8 h-8 text-green-500" />;
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  
  return <File className="w-8 h-8 text-gray-500" />;
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
  readOnly = false // VALOR POR DEFECTO AGREGADO
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

  useEffect(() => {
    // Escuchar cambios en el evento global para actualizar adjuntos
    if (event?.itinerarios_array) {
      const currentItinerary = event.itinerarios_array.find(it => it._id === itinerarioId);
      if (currentItinerary) {
        const currentTask = currentItinerary.tasks.find(t => t._id === taskId);
        if (currentTask && currentTask.attachments) {
          // Solo actualizar si hay cambios reales
          if (JSON.stringify(currentTask.attachments) !== JSON.stringify(attachments)) {
            onUpdate(currentTask.attachments);
          }
        }
      }
    }
  }, [event, itinerarioId, taskId]);

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
          
          // Remover después de 3 segundos
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
            // Actualizar en la base de datos
            await fetchApiEventos({
              query: queries.editTask,
              variables: {
                eventID: eventId,
                itinerarioID: itinerarioId,
                taskID: taskId,
                variable: "attachments",
                valor: JSON.stringify(newAttachments)
              },
              domain: config.domain
            });

            // Actualizar estado local
            onUpdate(newAttachments);
            
            setUploadingFiles(prev => prev.map(uf => 
              uf.id === uploadId ? { ...uf, status: 'success' } : uf
            ));
            
            // Remover de la lista después de 2 segundos
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
          }
        }
      );
    });
  };

  const handleDelete = async (file: FileData) => {
    if (!file.name) return;
    
    setDeletingFiles(prev => [...prev, file.name]);
    
    try {
      // Eliminar del storage
      const storageRef = ref(storage, `${taskId}//${file.name}`);
      await deleteObject(storageRef).catch(() => {
        // Ignorar error si el archivo no existe
      });

      // Actualizar lista de adjuntos
      const newAttachments = attachments.filter(a => a.name !== file.name);
      
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: eventId,
          itinerarioID: itinerarioId,
          taskID: taskId,
          variable: "attachments",
          valor: JSON.stringify(newAttachments)
        },
        domain: config.domain
      });

      onUpdate(newAttachments);
      toast("success", t("Archivo eliminado"));
      
    } catch (error) {
      console.error('Error deleting file:', error);
      toast("error", t("Error al eliminar archivo"));
    } finally {
      setDeletingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const handleDownload = async (file: FileData) => {
    try {
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
    <div className="space-y-4">
      {/* Área de carga - CONDICIONADA PARA MODO SOLO LECTURA */}
      {!readOnly && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-primary' : 'text-gray-400'
          }`} />
          
          <p className="text-sm text-gray-600 mb-2">
            {isDragging ? (
              <span className="text-primary font-medium">{t('Suelta los archivos aquí')}</span>
            ) : (
              <>
                {t('Arrastra y suelta archivos aquí, o')}{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {t('selecciona archivos')}
                </button>
              </>
            )}
          </p>
          
          <p className="text-xs text-gray-500">
            {t('Tamaño máximo: 10MB por archivo')}
          </p>
        </div>
      )}

      {/* Archivos subiendo - SOLO SI NO ES MODO SOLO LECTURA */}
      {!readOnly && uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">{t('Subiendo archivos')}</h5>
          {uploadingFiles.map(uf => (
            <div key={uf.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {uf.status === 'uploading' ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : uf.status === 'success' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{uf.file.name}</p>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
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
              
              <span className="text-xs text-gray-500">
                {formatFileSize(uf.file.size)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de archivos */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">
            {t('Archivos adjuntos')} ({attachments.length})
            {/* INDICADOR DE MODO SOLO LECTURA */}
            {readOnly && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                <Lock className="w-3 h-3 mr-1" />
                {t('Solo lectura')}
              </span>
            )}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {attachments.map((file) => (
              <div
                key={file._id || file.name}
                className={`group relative flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${
                  deletingFiles.includes(file.name) ? 'opacity-50' : ''
                }`}
              >
                {getFileIcon(file.name)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Botón de descarga - SIEMPRE DISPONIBLE */}
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1 text-gray-500 hover:text-primary rounded"
                    title={t('Descargar')}
                    disabled={deletingFiles.includes(file.name)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {/* Botón de eliminar - SOLO SI NO ES MODO SOLO LECTURA */}
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded"
                      title={t('Eliminar')}
                      disabled={deletingFiles.includes(file.name)}
                    >
                      {deletingFiles.includes(file.name) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MENSAJE CUANDO NO HAY ADJUNTOS */
        <div className="text-center py-6">
          {readOnly ? (
            /* MENSAJE PARA MODO SOLO LECTURA */
            <div className="flex flex-col items-center space-y-2">
              <File className="w-12 h-12 text-gray-300" />
              <p className="text-sm text-gray-500">{t('Sin adjuntos')}</p>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                <Lock className="w-3 h-3 mr-1" />
                {t('Solo lectura')}
              </div>
            </div>
          ) : (
            /* MENSAJE PARA MODO EDICIÓN */
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm text-gray-500">{t('No hay archivos adjuntos')}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                {t('Agregar el primer archivo')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};