import React, { useRef, useEffect, useState } from 'react';
import { getViewBox, calculateScaleFromViewBox, ViewBox } from '../utils/svgUtils';

interface SvgWrapperProps {
  children: React.ReactElement;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  // Propiedades SVG
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  opacity?: number;
  strokeDasharray?: string;
  transform?: string;
  filter?: string;
  // Propiedades adicionales útiles
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  strokeOpacity?: number;
  fillOpacity?: number;
  // Propiedades para viewBox
  autoScale?: boolean;
  targetSize?: { width: number; height: number };
  maintainAspectRatio?: boolean;
}

const SvgWrapper: React.FC<SvgWrapperProps> = ({
  children,
  width = 24,
  height = 24,
  className = "",
  style = {},
  // Propiedades SVG
  fill,
  stroke,
  strokeWidth,
  opacity,
  strokeDasharray,
  transform,
  filter,
  // Propiedades adicionales
  strokeLinecap,
  strokeLinejoin,
  strokeOpacity,
  fillOpacity,
  // Propiedades para viewBox
  autoScale = false,
  targetSize,
  maintainAspectRatio = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox | null>(null);
  const [calculatedTransform, setCalculatedTransform] = useState<string>('');

  // Función para obtener viewBox del SVG renderizado
  const getViewBoxFromRenderedSvg = () => {
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        const vb = getViewBox(svgElement);
        console.log('🔍 SVG Debug:', {
          element: svgElement,
          viewBox: vb,
          viewBoxAttr: svgElement.getAttribute('viewBox'),
          widthAttr: svgElement.getAttribute('width'),
          heightAttr: svgElement.getAttribute('height'),
          className: svgElement.className,
        });
        if (vb) {
          setViewBox(vb);
          return vb;
        }
      }
    }
    return null;
  };

  // Intentar obtener viewBox después del render
  useEffect(() => {
    // Intento inmediato
    let vb = getViewBoxFromRenderedSvg();

    // Si no se pudo obtener, intentar con un pequeño delay
    if (!vb) {
      const timer = setTimeout(() => {
        vb = getViewBoxFromRenderedSvg();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [children]);

  // Calcular transform cuando cambie el viewBox
  useEffect(() => {
    if (autoScale && targetSize && viewBox) {
      console.log('🎯 Calculando transform:', {
        viewBox,
        targetSize,
        maintainAspectRatio
      });

      const scaleTransform = calculateScaleFromViewBox(
        viewBox,
        targetSize.width,
        targetSize.height,
        maintainAspectRatio
      );

      console.log('✨ Transform calculada:', scaleTransform);
      setCalculatedTransform(scaleTransform);
    }
  }, [viewBox, autoScale, targetSize, maintainAspectRatio]);

  // Crear objeto de propiedades SVG
  const svgProps: React.SVGProps<SVGSVGElement> = {
    width: '100%',
    height: '100%',
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain'
    }
  };

  // Agregar propiedades SVG si están definidas
  if (fill !== undefined) svgProps.fill = fill;
  if (stroke !== undefined) svgProps.stroke = stroke;
  if (strokeWidth !== undefined) svgProps.strokeWidth = strokeWidth;
  if (opacity !== undefined) svgProps.opacity = opacity;
  if (strokeDasharray !== undefined) svgProps.strokeDasharray = strokeDasharray;
  if (filter !== undefined) svgProps.filter = filter;
  if (strokeLinecap !== undefined) svgProps.strokeLinecap = strokeLinecap;
  if (strokeLinejoin !== undefined) svgProps.strokeLinejoin = strokeLinejoin;
  if (strokeOpacity !== undefined) svgProps.strokeOpacity = strokeOpacity;
  if (fillOpacity !== undefined) svgProps.fillOpacity = fillOpacity;

  // Manejar transform
  if (autoScale && calculatedTransform) {
    svgProps.transform = calculatedTransform;
  } else if (transform) {
    svgProps.transform = transform;
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
    >
      {React.cloneElement(children, svgProps)}
    </div>
  );
};

export default SvgWrapper; 