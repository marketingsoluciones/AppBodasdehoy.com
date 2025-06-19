import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  X, 
  Download, 
  Trash2, 
  Upload,
  File,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Plus,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { downloadFile } from '../../Utils/storages';
import { useToast } from '../../../hooks/useToast';
import { Task, FileData } from '../../../utils/Interfaces';
import ClickAwayListener from 'react-click-away-listener';
import { customAlphabet } from 'nanoid';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { AuthContextProvider, EventContextProvider } from '../../../context';

interface AttachmentsEditorProps {
  value: any[];
  onChange: (attachments: any[]) => void;
  taskId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  task: Task;
  itinerarioId: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const iconMap: { [key: string]: JSX.Element } = {
    // Imágenes
    jpg: <Image className="w-4 h-4" />,
    jpeg: <Image className="w-4 h-4" />,
    png: <Image className="w-4 h-4" />,
    gif: <Image className="w-4 h-4" />,
    svg: <Image className="w-4 h-4" />,
    webp: <Image className="w-4 h-4" />,
    
    // Documentos
    pdf: <FileText className="w-4 h-4 text-red-500" />,
    doc: <FileText className="w-4 h-4 text-blue-500" />,
    docx: <FileText className="w-4 h-4 text-blue-500" />,
    txt: <FileText className="w-4 h-4" />,
    
    // Audio
    mp3: <Music className="w-4 h-4 text-purple-500" />,
    wav: <Music className="w-4 h-4 text-purple-500" />,
    ogg: <Music className="w-4 h-4 text-purple-500" />,
    
    // Video
    mp4: <Video className="w-4 h-4 text-green" />,
    avi: <Video className="w-4 h-4 text-green" />,
    mov: <Video className="w-4 h-4 text-green" />,
    
    // Archivos
    zip: <Archive className="w-4 h-4 text-yellow-500" />,
    rar: <Archive className="w-4 h-4 text-yellow-500" />,
    '7z': <Archive className="w-4 h-4 text-yellow-500" />,
  };
  
  return iconMap[ext] || <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({
  value = [],
  onChange,
  taskId,
  isEditing,
  onStartEdit,
  onStopEdit,
  task,
  itinerarioId
}) => {
  const [attachments, setAttachments] = useState<FileData[]>(() => {
    // Asegurarse de que value tenga el formato correcto
    if (!value || !Array.isArray(value)) return [];
    return value.map(item => {
      if (item.name && item.size !== undefined) {
        return item as FileData;
      }
      // Si es un objeto File, convertirlo a FileData
      return {
        _id: item._id,
        name: item.name || 'unknown',
        size: item.size || 0
      };
    });
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDropzone, setShowDropzone] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const storage = getStorage();
  const toast = useToast();

  useEffect(() => {
    if (!value || !Array.isArray(value)) {
      setAttachments([]);
      return;
    }
    const formattedValue = value.map(item => {
      if (item.name && item.size !== undefined) {
        return item as FileData;
      }
      return {
        _id: item._id,
        name: item.name || 'unknown',
        size: item.size || 0
      };
    });
    setAttachments(formattedValue);
  }, [value]);

  useEffect(() => {
    if (isEditing && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 400 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isEditing]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      const filesArray = Array.from(files);
      
      // Crear nuevos attachments con los archivos
      let newAttachments: FileData[] = [
        ...attachments,
        ...filesArray.map((file: File): FileData => ({
          _id: undefined,
          name: file.name,
          size: file.size
        }))
      ];
      
      // Actualizar estado local inmediatamente
      setAttachments(newAttachments);
      onChange(newAttachments);
      
      // Subir archivos uno por uno
      for (const file of filesArray) {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast('error', t('El archivo es demasiado grande. Máximo 10MB'));
          continue;
        }
        
        const storageRef = ref(storage, `${taskId}//${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.error('Error uploading file:', error);
            toast('error', t('Error al subir archivo'));
          },
          async () => {
            // Archivo subido exitosamente
            const fileIndex = newAttachments.findIndex((el: FileData) => el.name === file.name);
            if (fileIndex !== -1) {
              // Generar ID único para el archivo
              newAttachments[fileIndex]._id = customAlphabet('1234567890abcdef', 24)();
              
              // Actualizar en el backend
              await fetchApiEventos({
                query: queries.editTask,
                variables: {
                  eventID: event._id,
                  itinerarioID: itinerarioId,
                  taskID: taskId,
                  variable: "attachments",
                  valor: JSON.stringify(newAttachments)
                },
                domain: config.domain
              });
              
              // Actualizar estado global del evento
              setEvent((prevEvent) => {
                const newEvent = { ...prevEvent };
                const f1 = newEvent.itinerarios_array.findIndex(elm => elm._id === itinerarioId);
                if (f1 !== -1) {
                  const f2 = newEvent.itinerarios_array[f1].tasks.findIndex(elm => elm._id === taskId);
                  if (f2 !== -1) {
                    newEvent.itinerarios_array[f1].tasks[f2].attachments = [...newAttachments];
                  }
                }
                return newEvent;
              });
              
              // Actualizar estado local
              setAttachments([...newAttachments]);
              onChange([...newAttachments]);
            }
          }
        );
      }
      
      toast('success', t('Archivos subidos correctamente'));
    } catch (error) {
      console.error('Error uploading files:', error);
      toast('error', t('Error al subir archivos'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setShowDropzone(false);
    }
  };

  const handleDelete = async (attachment: FileData) => {
    try {
      // Eliminar del storage
      const storageRef = ref(storage, `${taskId}//${attachment.name}`);
      await deleteObject(storageRef).catch(() => {
        // Ignorar error si el archivo no existe
      });
      
      // Actualizar lista local
      const newAttachments = attachments.filter(el => el.name !== attachment.name);
      
      // Actualizar en el backend
      await fetchApiEventos({
        query: queries.editTask,
        variables: {
          eventID: event._id,
          itinerarioID: itinerarioId,
          taskID: taskId,
          variable: "attachments",
          valor: JSON.stringify(newAttachments)
        },
        domain: config.domain
      });
      
      // Actualizar estado global del evento
      setEvent((prevEvent) => {
        const newEvent = { ...prevEvent };
        const f1 = newEvent.itinerarios_array.findIndex(elm => elm._id === itinerarioId);
        if (f1 !== -1) {
          const f2 = newEvent.itinerarios_array[f1].tasks.findIndex(elm => elm._id === taskId);
          if (f2 !== -1) {
            newEvent.itinerarios_array[f1].tasks[f2].attachments = [...newAttachments];
          }
        }
        return newEvent;
      });
      
      // Actualizar estado local
      setAttachments(newAttachments);
      onChange(newAttachments);
      
      toast('success', t('Archivo eliminado'));
    } catch (error) {
      console.error('Error deleting file:', error);
      toast('error', t('Error al eliminar archivo'));
    }
  };

  const handleDownload = async (attachment: FileData) => {
    try {
      await downloadFile(storage, `${taskId}//${attachment.name}`);
      toast('success', t('Archivo descargado'));
    } catch (error) {
      console.error('Error downloading file:', error);
      toast('error', t('Error al descargar archivo'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropzone(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropzoneRef.current) {
      setShowDropzone(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropzone(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (!isEditing) {
    const attachmentCount = attachments.length;
    
    return (
      <div 
        ref={cellRef}
        className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 group min-h-[48px]"
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
      >
        <Paperclip className="w-4 h-4 text-gray-400 group-hover:text-primary" />
        <span className={`text-sm ${attachmentCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {attachmentCount > 0 ? attachmentCount : t('Sin archivos')}
        </span>
        {attachmentCount > 0 && (
          <div className="flex items-center space-x-1 text-gray-400">
            <span className="text-xs">({formatFileSize(attachments.reduce((acc, file) => acc + (file.size || 0), 0))})</span>
            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={cellRef} className="relative">
      <div className="flex items-center space-x-2 px-3 py-2 min-h-[48px]">
        <Paperclip className="w-4 h-4 text-primary" />
        <span className="text-sm text-gray-900 font-medium">
          {attachments.length} {t('archivos')}
        </span>
      </div>
      
      <ClickAwayListener onClickAway={onStopEdit}>
        <div 
          className={`absolute z-50 ${dropdownPosition === 'bottom' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-96 bg-white border border-gray-200 rounded-lg shadow-xl`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">{t('Archivos adjuntos')}</h3>
            </div>
            <button
              onClick={onStopEdit}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Lista de archivos */}
          <div className="max-h-64 overflow-y-auto">
            {attachments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">{t('No hay archivos adjuntos')}</p>
              </div>
            ) : (
              <div className="p-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(attachment.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size || 0)}
                        </p>
                      </div>
                      
                      {/* Indicador de estado */}
                      {attachment._id ? (
                        <Check className="w-4 h-4 text-green" />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={t('Descargar')}
                        disabled={!attachment._id}
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(attachment)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title={t('Eliminar')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zona de carga */}
          <div className="p-4 border-t border-gray-200">
            {showDropzone && (
              <div 
                ref={dropzoneRef}
                className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10"
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">{t('Suelta los archivos aquí')}</p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('Subiendo')} {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t('Agregar archivos')}</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              {t('Máximo 10MB por archivo')}
            </p>
          </div>
        </div>
      </ClickAwayListener>
    </div>
  );
};