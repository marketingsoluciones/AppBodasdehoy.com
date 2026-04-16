export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Obtiene el viewBox de un elemento SVG
 */
export const getViewBox = (svgElement: SVGSVGElement): ViewBox | null => {
  const viewBoxAttr = svgElement.getAttribute('viewBox');
  if (viewBoxAttr) {
    const [x, y, width, height] = viewBoxAttr.split(' ').map(Number);
    return { x, y, width, height };
  }

  // Si no hay viewBox, usar width y height
  const widthAttr = svgElement.getAttribute('width');
  const heightAttr = svgElement.getAttribute('height');
  if (widthAttr && heightAttr) {
    return { x: 0, y: 0, width: Number(widthAttr), height: Number(heightAttr) };
  }

  return null;
};

/**
 * Calcula el escalado basado en viewBox para ajustarse a un tamaño objetivo
 */
export const calculateScaleFromViewBox = (
  viewBox: ViewBox,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean = true
): string => {
  if (maintainAspectRatio) {
    const scaleX = targetWidth / viewBox.width;
    const scaleY = targetHeight / viewBox.height;
    const scale = Math.min(scaleX, scaleY); // Mantener proporción

    // Calcular centrado
    const scaledWidth = viewBox.width * scale;
    const scaledHeight = viewBox.height * scale;
    const translateX = (targetWidth - scaledWidth) / 2;
    const translateY = (targetHeight - scaledHeight) / 2;

    return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  } else {
    // Estirar para llenar completamente
    const scaleX = targetWidth / viewBox.width;
    const scaleY = targetHeight / viewBox.height;

    return `scale(${scaleX}, ${scaleY})`;
  }
};

/**
 * Calcula el factor de escala para un viewBox dado
 */
export const getScaleFactor = (
  viewBox: ViewBox,
  targetWidth: number,
  targetHeight: number
): number => {
  const scaleX = targetWidth / viewBox.width;
  const scaleY = targetHeight / viewBox.height;
  return Math.min(scaleX, scaleY);
};

/**
 * Obtiene las dimensiones escaladas manteniendo proporción
 */
export const getScaledDimensions = (
  viewBox: ViewBox,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number } => {
  const scale = getScaleFactor(viewBox, targetWidth, targetHeight);
  return {
    width: viewBox.width * scale,
    height: viewBox.height * scale
  };
};

/**
 * Calcula el offset para centrar el SVG escalado
 */
export const getCenteringOffset = (
  viewBox: ViewBox,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number } => {
  const scaledDimensions = getScaledDimensions(viewBox, targetWidth, targetHeight);
  return {
    x: (targetWidth - scaledDimensions.width) / 2,
    y: (targetHeight - scaledDimensions.height) / 2
  };
};

/**
 * Crea una transformación completa para escalar y centrar un SVG
 */
export const createSvgTransform = (
  viewBox: ViewBox,
  targetWidth: number,
  targetHeight: number,
  additionalTransform?: string
): string => {
  const scaleTransform = calculateScaleFromViewBox(viewBox, targetWidth, targetHeight);

  if (additionalTransform) {
    return `${scaleTransform} ${additionalTransform}`;
  }

  return scaleTransform;
}; 