/**
 * Constantes para tamaños de SVG
 */
export const SVG_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024, // 10KB en bytes
  MAX_FILE_SIZE_KB: 10,
  RECOMMENDED_SIZE: 5 * 1024, // 5KB en bytes
  RECOMMENDED_SIZE_KB: 5,
} as const;

/**
 * Formatea el tamaño en bytes a una cadena legible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valida si un archivo SVG cumple con los límites de tamaño
 */
export const validateSvgSize = (file: File | string): { isValid: boolean; size: number; formattedSize: string; message?: string } => {
  const size = typeof file === 'string' ? file.length : file.size;
  const formattedSize = formatFileSize(size);

  if (size > SVG_SIZE_LIMITS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      size,
      formattedSize,
      message: `El SVG es demasiado grande. Tamaño máximo: ${SVG_SIZE_LIMITS.MAX_FILE_SIZE_KB}KB. Tu archivo: ${formattedSize}`
    };
  }

  if (size > SVG_SIZE_LIMITS.RECOMMENDED_SIZE) {
    return {
      isValid: true,
      size,
      formattedSize,
      message: `Advertencia: El SVG es grande (${formattedSize}). Se recomienda menos de ${SVG_SIZE_LIMITS.RECOMMENDED_SIZE_KB}KB para mejor rendimiento.`
    };
  }

  return {
    isValid: true,
    size,
    formattedSize
  };
};

/**
 * Obtiene información de optimización para un SVG
 */
export const getSvgOptimizationInfo = (svgContent: string): {
  originalSize: string;
  optimizationTips: string[];
  canOptimize: boolean;
} => {
  const size = svgContent.length;
  const formattedSize = formatFileSize(size);
  const optimizationTips: string[] = [];
  let canOptimize = false;

  // Verificar si tiene comentarios
  if (svgContent.includes('<!--')) {
    optimizationTips.push('Eliminar comentarios del SVG');
    canOptimize = true;
  }

  // Verificar si tiene espacios en blanco innecesarios
  const compressedSize = svgContent.replace(/\s+/g, ' ').length;
  if (size - compressedSize > 100) {
    optimizationTips.push('Eliminar espacios en blanco innecesarios');
    canOptimize = true;
  }

  // Verificar si tiene metadatos
  if (svgContent.includes('<metadata>') || svgContent.includes('Created by')) {
    optimizationTips.push('Eliminar metadatos innecesarios');
    canOptimize = true;
  }

  // Verificar si tiene elementos no utilizados
  if (svgContent.includes('defs') && !svgContent.includes('use')) {
    optimizationTips.push('Eliminar definiciones no utilizadas');
    canOptimize = true;
  }

  return {
    originalSize: formattedSize,
    optimizationTips,
    canOptimize
  };
};

/**
 * Calcula el tamaño aproximado de un SVG optimizado
 */
export const estimateOptimizedSize = (svgContent: string): string => {
  // Eliminar comentarios
  let optimized = svgContent.replace(/<!--[\s\S]*?-->/g, '');

  // Eliminar espacios en blanco innecesarios
  optimized = optimized.replace(/\s+/g, ' ');

  // Eliminar metadatos
  optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/g, '');

  return formatFileSize(optimized.length);
}; 