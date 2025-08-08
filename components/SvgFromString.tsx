import React from 'react';

interface SvgFromStringProps {
  svgString: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const SvgFromString: React.FC<SvgFromStringProps> = ({
  svgString,
  className = "",
  style = {},
  ...props
}) => {
  // Función para limpiar y convertir atributos HTML a React
  const convertHtmlAttributesToReact = (attributes: Record<string, string>): Record<string, string> => {
    const reactAttributes: Record<string, string> = {};

    Object.entries(attributes).forEach(([key, value]) => {
      switch (key) {
        case 'class':
          reactAttributes['className'] = value;
          break;
        case 'stroke-width':
          reactAttributes['strokeWidth'] = value;
          break;
        case 'stroke-linecap':
          reactAttributes['strokeLinecap'] = value;
          break;
        case 'stroke-linejoin':
          reactAttributes['strokeLinejoin'] = value;
          break;
        case 'stroke-opacity':
          reactAttributes['strokeOpacity'] = value;
          break;
        case 'fill-opacity':
          reactAttributes['fillOpacity'] = value;
          break;
        case 'stroke-dasharray':
          reactAttributes['strokeDasharray'] = value;
          break;
        default:
          // Solo incluir atributos válidos de SVG
          if (['width', 'height', 'viewBox', 'fill', 'stroke', 'opacity', 'transform', 'filter'].includes(key)) {
            reactAttributes[key] = value;
          }
          break;
      }
    });

    return reactAttributes;
  };

  // Extraer atributos del SVG usando regex mejorado
  const extractSvgAttributes = (svgStr: string): Record<string, string> => {
    const match = svgStr.match(/<svg([^>]*)>/i);
    if (!match) return {};

    const attributes: Record<string, string> = {};
    // Regex mejorado para capturar atributos con espacios y valores complejos
    const attrRegex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(match[1])) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }

    return convertHtmlAttributesToReact(attributes);
  };

  // Limpiar el contenido SVG interno de forma más agresiva
  const cleanSvgContent = (content: string): string => {
    return content
      // Remover atributos class completamente para evitar warnings
      .replace(/class=["'][^"']*["']/g, '')
      .replace(/stroke-width=/g, 'strokeWidth=')
      .replace(/stroke-linecap=/g, 'strokeLinecap=')
      .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
      .replace(/stroke-opacity=/g, 'strokeOpacity=')
      .replace(/fill-opacity=/g, 'fillOpacity=')
      .replace(/stroke-dasharray=/g, 'strokeDasharray=');
  };

  // Extraer el contenido del SVG (sin las etiquetas <svg>)
  const extractSvgContent = (svgStr: string): string => {
    const match = svgStr.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return match ? match[1] : svgStr;
  };

  const svgAttributes = extractSvgAttributes(svgString);
  const svgContent = cleanSvgContent(extractSvgContent(svgString));

  // Usar un enfoque más simple para evitar warnings
  return (
    <svg
      {...svgAttributes}
      className={className}
      style={style}
      {...props}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default SvgFromString; 