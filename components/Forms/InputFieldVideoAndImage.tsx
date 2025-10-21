import { useField } from "formik"
import React, { FC, useRef, useState, DragEvent, ChangeEvent } from "react"
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { MdClose, MdCloudUpload, MdImage, MdVideocam } from "react-icons/md";

interface propsInputFieldMedia {
  name: string
  label?: string
  className?: string
  disabled?: boolean
  mediaType: 'image' | 'video'
  accept?: string
  dragDropText?: string
  selectFileText?: string
  disabledPreview?: boolean
}

export interface MediaFileContent {
  file: File | null;
  preview: string | null;
}

const InputFieldVideoAndImage: FC<propsInputFieldMedia> = ({ label, className, disabled = false, mediaType = 'image', accept, dragDropText, selectFileText, disabledPreview = false, ...props }) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField<MediaFileContent>({ name: props.name })
  const [isAllowed] = useAllowed()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultAccept = mediaType === 'image'
    ? 'image/jpeg,image/png,image/gif,image/webp'
    : 'video/mp4,video/mpeg,video/quicktime'

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && isAllowed()) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!isAllowed() || disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    // Validar tipo de archivo
    const validTypes = (accept || defaultAccept).split(',').map(t => t.trim())
    const isValidType = validTypes.some(type => {
      if (type.includes('/*')) {
        return file.type.startsWith(type.split('/')[0])
      }
      return file.type === type
    })

    if (!isValidType) {
      alert(t(`Please select a valid ${mediaType} file`))
      return
    }

    // Crear preview usando FileReader
    const reader = new FileReader()
    reader.onloadend = () => {
      helpers.setValue({
        file: file,
        preview: reader.result as string
      })
    }
    reader.readAsDataURL(file)
  }

  const handleClickUpload = () => {
    if (fileInputRef.current && !disabled && isAllowed()) {
      fileInputRef.current.click()
    }
  }

  const handleClearValue = () => {
    helpers.setValue({ file: null, preview: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const MediaIcon = mediaType === 'image' ? MdImage : MdVideocam
  const hasFile = field.value?.file !== null && field.value?.file !== undefined

  return (
    <div className="w-full h-max relative">
      {label && <label className="font-display text-primary text-sm w-full">{label}</label>}

      <div className="w-full relative">
        {/* Área de drag and drop y preview */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!hasFile ? handleClickUpload : undefined}
          className={`
            border-[1px] rounded-xl p-4 transition-all relative
            ${isDragging ? 'border-primary bg-blue-50' : meta.touched && meta.error ? 'border-rose-300' : 'border-gray-200'}
            ${!hasFile ? 'cursor-pointer' : ''}
            ${!isAllowed() || disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : !hasFile ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white'}
          `}
        >
          {hasFile ? (
            // Vista previa del archivo
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative w-full flex items-center justify-center">
                {mediaType === 'image' && field.value?.preview && !disabledPreview ? (
                  <img
                    src={field.value.preview}
                    alt="Preview"
                    className="max-h-48 max-w-full object-contain rounded-lg"
                  />
                ) : mediaType === 'video' && field.value?.preview && !disabledPreview ? (
                  <video
                    src={field.value.preview}
                    controls
                    className="max-h-48 max-w-full rounded-lg"
                  />
                ) : null}
              </div>

              <div className="flex flex-col items-center space-y-1">
                <p className="text-gray-700 text-xs font-medium truncate max-w-full">
                  {field.value?.file?.name}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {field.value?.file ? (field.value.file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleClickUpload}
                  disabled={!isAllowed() || disabled}
                  className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Change")}
                </button>
                <button
                  type="button"
                  onClick={handleClearValue}
                  disabled={!isAllowed() || disabled}
                  className="px-3 py-1.5 text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <MdClose className="text-sm" />
                  {t("Remove")}
                </button>
              </div>
            </div>
          ) : (
            // Vista de carga inicial
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <MediaIcon className="text-3xl" />
                <MdCloudUpload className="text-4xl" />
              </div>
              <p className="text-gray-600 text-xs text-center font-medium">
                {dragDropText || t("Arrastra y suelta para subir el archivo")}
              </p>
              <p className="text-gray-400 text-[10px] text-center">
                {selectFileText || t("O elige archivos de tu dispositivo")}
              </p>
              <p className="text-gray-400 text-[10px] text-center mt-1">
                {mediaType === 'image' ? t("Supported formats: JPG, PNG, GIF, WEBP") : t("Supported formats: MP4, MPEG, MOV")}
              </p>
            </div>
          )}
        </div>

        {/* Input de archivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={!isAllowed() || disabled}
        />
      </div>

      {meta.touched && meta.error && (
        <p className="font-display rounded-xl text-xs text-red flex gap-1 mt-1">
          {typeof meta.error === 'string' ? meta.error : JSON.stringify(meta.error)}
        </p>
      )}
    </div>
  )
}

export default React.memo(InputFieldVideoAndImage)
