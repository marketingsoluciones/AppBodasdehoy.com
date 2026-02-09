'use client';

/**
 * ImageUploader Component
 * =======================
 * Componente para subir imágenes al wedding site
 * Soporta drag & drop, preview y URL directa
 */

import React, { useState, useCallback, useRef } from 'react';

export interface ImageUploaderProps {
  /** Accept specific file types */
  accept?: string;
  /** Aspect ratio for preview (e.g., '16/9', '1/1') */
  aspectRatio?: string;
  /** Custom class name */
  className?: string;
  /** Disable the uploader */
  disabled?: boolean;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Callback when image changes */
  onChange: (url: string) => void;
  /** Callback when upload ends */
  onUploadEnd?: () => void;
  /** Callback when upload starts */
  onUploadStart?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Current image URL */
  value?: string;
}

export function ImageUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  placeholder = 'Arrastra una imagen o haz clic para seleccionar',
  accept = 'image/*',
  maxSizeMB = 5,
  aspectRatio = '16/9',
  className = '',
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'El archivo debe ser una imagen';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo debe ser menor a ${maxSizeMB}MB`;
    }
    return null;
  }, [maxSizeMB]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);
    onUploadStart?.();

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'wedding-image');

      // Try to upload to local API
      try {
        const response = await fetch('/api/upload', {
          body: formData,
          method: 'POST',
          signal: AbortSignal.timeout(30_000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.url) {
            return data.url;
          }
        }
      } catch {
        console.log('Upload API not available, using local preview');
      }

      // Fallback: Use local data URL (for development/preview)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });

    } catch (error) {
      console.error('Upload error:', error);
      setError('Error al subir la imagen');
      return null;
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
    }
  }, [onUploadStart, onUploadEnd]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));

    if (!imageFile) {
      setError('Por favor, arrastra una imagen');
      return;
    }

    const validationError = validateFile(imageFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    const url = await uploadFile(imageFile);
    if (url) {
      onChange(url);
    }
  }, [disabled, validateFile, uploadFile, onChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const url = await uploadFile(file);
    if (url) {
      onChange(url);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFile, uploadFile, onChange]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onChange(urlInput);
      setUrlInput('');
      setShowUrlInput(false);
      setError(null);
    } catch {
      setError('URL no válida');
    }
  }, [urlInput, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setError(null);
  }, [onChange]);

  return (
    <div className={`image-uploader ${className}`}>
      {/* Image Preview */}
      {value ? (
        <div
          className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          style={{ aspectRatio }}
        >
          <img
            alt="Preview"
            className="w-full h-full object-cover"
            src={value}
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                className="px-3 py-1.5 bg-white text-gray-700 rounded text-sm hover:bg-gray-100"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Cambiar
              </button>
              <button
                className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                onClick={handleRemove}
                type="button"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Drop Zone */
        <div
          className={`
            relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed
            transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ aspectRatio }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Subiendo...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
              <p className="text-sm text-gray-500 text-center px-4">
                {placeholder}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {/* URL Input Toggle */}
      {!value && !disabled && (
        <div className="mt-2">
          {showUrlInput ? (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://ejemplo.com/imagen.jpg"
                type="url"
                value={urlInput}
              />
              <button
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                onClick={handleUrlSubmit}
                type="button"
              >
                OK
              </button>
              <button
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                type="button"
              >
                X
              </button>
            </div>
          ) : (
            <button
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={() => setShowUrlInput(true)}
              type="button"
            >
              O pegar URL de imagen
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default ImageUploader;
