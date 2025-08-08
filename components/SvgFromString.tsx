import React from 'react';

interface SvgFromStringProps {
  svgString: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // Para props adicionales
}

const SvgFromString: React.FC<SvgFromStringProps> = ({
  svgString,
  className = "",
  style = {},
  ...props
}) => {
  // Extraer el contenido del SVG (sin las etiquetas <svg>)
  const extractSvgContent = (svgStr: string): string => {
    const match = svgStr.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return match ? match[1] : svgStr;
  };

  // Extraer atributos del SVG
  const extractSvgAttributes = (svgStr: string): Record<string, string> => {
    const match = svgStr.match(/<svg([^>]*)>/i);
    if (!match) return {};

    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(match[1])) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }

    return attributes;
  };

  const svgAttributes = extractSvgAttributes(svgString);
  const svgContent = extractSvgContent(svgString);

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