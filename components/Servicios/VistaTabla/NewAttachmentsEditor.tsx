import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { Upload, X, FileText, FileImage, FileVideo, FileAudio, File, Check, Loader2, Download, Trash2, Lock, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStorage, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { FileData, Task } from '../../../utils/Interfaces';
import { customAlphabet } from "nanoid";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { AuthContextProvider, EventContextProvider } from "../../../context";
import { downloadFile } from "../../Utils/storages";
import { useToast } from "../../../hooks/useToast";

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

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface Props {
  handleUpdate: (file: FileData) => Promise<void>;
  task: Task;
  itinerarioId: string;
  canEdit?: boolean;
  owner: boolean;
  showAttachments?: boolean;
  setShowAttachments?: (showAttachments: boolean) => void;
}

export const NewAttachmentsEditor: React.FC<Props> = ({ handleUpdate, task, itinerarioId, canEdit = false, owner, showAttachments, setShowAttachments }) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const storage = getStorage();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<string[]>([]);
  const ruta = window.location.pathname;
  const isItinerarioRoute = ["/itinerario"].includes(ruta);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    // Verificar archivos duplicados
    const existingNames = task.attachments.map(elem => elem.name);
    const duplicates = filesArray.filter(file => existingNames.includes(file.name));
    if (duplicates.length > 0) {
      toast("error", t(`Archivos duplicados: ${duplicates.map(elem => elem.name).join(', ')}`));
      return;
    }
    // Subir archivos
    for (const file of filesArray) {
      const uploadId = customAlphabet('1234567890abcdef', 24)();
      setUploadingFiles(prev => [...prev, {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading'
      }]);
      // IMPORTANTE: Usar doble barra como en InputAttachments
      const storageRef = ref(storage, `${task._id}//${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingFiles(prev => prev.map(elem =>
            elem.id === uploadId ? { ...elem, progress } : elem
          ));
        },
        (error) => {
          console.error('Error uploading file:', error);
          setUploadingFiles(prev => prev.map(elem =>
            elem.id === uploadId ? { ...elem, status: 'error' } : elem
          ));
          toast("error", t(`Error al subir ${file.name}`));
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(elem => elem.id !== uploadId));
          }, 3000);
        },
        () => {
          // Archivo subido exitosamente
          const newFileData: FileData = {
            _id: customAlphabet('1234567890abcdef', 24)(),
            name: file.name,
            size: file.size,
          };
          try {
            // IMPORTANTE: Actualizar la tarea completa como en InputAttachments
            const currentItinerary = event.itinerarios_array.find(elem => elem._id === itinerarioId);
            const currentTask = currentItinerary?.tasks.find(elem => elem._id === task._id);
            if (!currentTask) {
              throw new Error('Task not found');
            }
            // Actualizar con la estructura completa de la tarea
            setUploadingFiles(prev => prev.map(elem =>
              elem.id === uploadId ? { ...elem, status: 'success' } : elem
            ));
            fetchApiEventos({
              query: queries.addTaskAttachments,
              variables: {
                eventID: event._id,
                itinerarioID: itinerarioId,
                taskID: task._id,
                attachment: newFileData
              },
              domain: config.domain
            }).then(() => {
              toast("success", t("Archivo subido correctamente"));
              const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerarioId);
              const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === task._id);
              event.itinerarios_array[f1].tasks[f2].attachments.push(newFileData);
              setEvent({ ...event });
              setUploadingFiles(prev => prev?.filter(elem => elem.id !== uploadId));
            })
          } catch (error) {
            console.error('Error updating attachments:', error);
            // Si falla la actualización, eliminar el archivo del storage
            const deleteRef = ref(storage, `${task._id}//${file.name}`);
            deleteObject(deleteRef).catch(() => { });
            setUploadingFiles(prev => prev.map(elem =>
              elem.id === uploadId ? { ...elem, status: 'error' } : elem
            ));
            toast("error", t("Error al actualizar adjuntos"));
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(elem => elem.id !== uploadId));
            }, 3000);
          }
        }
      );
    };
  };

  const handleDelete = async (file: FileData) => {
    if (!file.name) return;
    setDeletingFiles(prev => [...prev, file.name]);
    try {
      // Eliminar del storage con doble barra
      const storageRef = ref(storage, `${task._id}//${file.name}`);
      await deleteObject(storageRef).catch((error) => {
        console.log('Archivo no existe en storage o ya fue eliminado:', error);
      });
      // Actualizar lista de adjuntos
      const newAttachments = task.attachments.filter(elem => elem.name !== file.name);
      // Obtener la tarea actual
      const currentItinerary = event.itinerarios_array.find(elem => elem._id === itinerarioId);
      const currentTask = currentItinerary?.tasks.find(elem => elem._id === task._id);
      if (currentTask) {
        const updatedTask = {
          ...currentTask,
          attachments: newAttachments
        };
        await fetchApiEventos({
          query: queries.deleteTaskAttachment,
          variables: {
            eventID: event._id,
            itinerarioID: itinerarioId,
            taskID: task._id,
            attachmentID: file._id
          },
          domain: config.domain
        });
        setEvent((oldEvent) => {
          if (!oldEvent) return oldEvent;
          const newEvent = { ...oldEvent };
          const itineraryIndex = newEvent.itinerarios_array?.findIndex(elem => elem._id === itinerarioId);
          if (itineraryIndex !== undefined && itineraryIndex > -1) {
            const taskIndex = newEvent.itinerarios_array[itineraryIndex].tasks?.findIndex(elem => elem._id === task._id);
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
      await downloadFile(storage, `${task._id}//${file.name}`);
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
    <div className="flex flex-col w-full bg-white max-h-[144px]">
      {/* Header fijo con título y botón de agregar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setShowAttachments(!showAttachments)}>
          <span className="text-xs text-gray-700">{t('Archivos adjuntos')}</span>
          <div className={`w-5 h-5 rounded-full ${task.attachments.length > 0 ? 'bg-emerald-600' : 'bg-gray-300'} flex items-center justify-center`}>
            <span className="text-xs text-white font-extrabold">{task.attachments.length}</span>
          </div>
          <span className={`text-xs ${task.attachments.length > 0 ? 'text-emerald-600' : 'text-gray-500'} font-bold`}>{showAttachments ? t("Ocultar") : t("Ver")}</span>
          {!canEdit && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              {t('Solo lectura')}
            </span>
          )}
        </div>
        {/* Botón de agregar archivo - Más compacto */}
        {canEdit && (
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
              className={`flex items-center text-xs text-primary ${isDragging ? 'text-primary' : ''}`}
            >
              {isDragging
                ? <>
                  <Upload className="w-3.5 h-3.5" />
                  {t('Suelta aquí')}
                </>
                : <>
                  <Plus className="w-3.5 h-3.5" />
                  {t('Agregar archivo')}
                </>
              }
            </button>
          </div>
        )}
      </div>
      {/* Contenedor con scroll para archivos */}
      <div className={`flex-1 overflow-y-auto px-3 py-1 space-y-0.5 border-[1px] border-gray-200 rounded-lg ${showAttachments ? 'block' : 'hidden'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Archivos subiendo - Más compacto */}
        {canEdit && uploadingFiles.length > 0 && uploadingFiles.map(elem => (
          <div key={elem.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            {elem.status === 'uploading'
              ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
              : elem.status === 'success'
                ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                : <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{elem.file.name}</p>
              <div className="mt-0.5 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${elem.status === 'success'
                    ? 'bg-green-500'
                    : elem.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-primary'
                    }`}
                  style={{ width: `${elem.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatFileSize(elem.file.size)}
            </span>
          </div>
        ))}
        {/* Lista de archivos - Diseño más compacto */}
        {task.attachments.length > 0
          ? task.attachments.map((file) => (
            <div
              key={file._id || file.name}
              className={`group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-100 transition-colors ${deletingFiles.includes(file.name) ? 'opacity-50' : ''
                }`}
            >
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0 -space-y-0.5">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1 text-gray-500 hover:text-gray-900 rounded"
                  title={t('Descargar')}
                  disabled={deletingFiles.includes(file.name)}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {canEdit && (
                  <button
                    onClick={() =>
                      isItinerarioRoute
                        ? owner
                          ? handleDelete(file)
                          : task.estatus
                            ? handleDelete(file)
                            : null
                        : handleDelete(file)
                    }
                    className="p-1 text-gray-500 hover:text-gray-900 rounded"
                    title={t('Eliminar')}
                    disabled={deletingFiles.includes(file.name)}
                  >
                    {deletingFiles.includes(file.name)
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : isItinerarioRoute
                        ? owner
                          ? <Trash2 className="w-3.5 h-3.5" />
                          : task.estatus
                            ? <Trash2 className="w-3.5 h-3.5" />
                            : null
                        : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))
          : canEdit && uploadingFiles.length === 0 &&
          <div
            className={`h-full flex items-center justify-center min-h-[40px] border border-dashed rounded-md text-center transition-all ${isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300'
              }`}
          >
            <div>
              <p className="text-xs text-gray-500">
                {isDragging
                  ? <span className="text-primary font-medium">{t('Suelta los archivos aquí')}</span>
                  : <>
                    {t('Arrastra archivos o')}{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      {t('haz clic aquí')}
                    </button>
                  </>
                }
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('Máx: 10MB')}
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  );
};