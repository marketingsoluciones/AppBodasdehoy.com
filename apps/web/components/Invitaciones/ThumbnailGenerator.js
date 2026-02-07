// components/ThumbnailGenerator.js

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

// --- TU PLANTILLA DE CORREO EN HTML ---
// Pega aquí tu código HTML. Para el ejemplo, uso una plantilla simple.
const emailTemplateHtml = `
<div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #333;">¡Confirmación de Pedido!</h1>
  </div>
  <p style="color: #555;">Hola Jafet,</p>
  <p style="color: #555;">Gracias por tu compra. Estamos preparando tu pedido para enviarlo. Aquí tienes un resumen:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <thead>
      <tr style="background-color: #4CAF50; color: white;">
        <th style="padding: 8px; border: 1px solid #ddd;">Producto</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Cantidad</th>
        <th style="padding: 8px; border: 1px solid #ddd;">Precio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Desarrollo Full-Stack</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">1</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$150.00</td>
      </tr>
    </tbody>
  </table>
  <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #888;">© 2025 Tu Empresa</p>
</div>
`;

export const ThumbnailGenerator = () => {
  const templateRef = useRef(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateThumbnail = () => {
    if (!templateRef.current) {
      return;
    }

    setIsLoading(true);

    // Opciones para controlar la salida. ¡Aquí defines el tamaño de tu thumbnail!
    const options = {
      quality: 0.95, // Calidad de la imagen
      width: 320,    // Ancho del thumbnail
      height: 440,   // Alto del thumbnail
      // Puedes usar pixelRatio para mayor calidad en pantallas de alta densidad
      pixelRatio: window.devicePixelRatio || 1,
      // Para asegurar que todos los estilos se apliquen
      style: {
        margin: '0',
        padding: '0',
        boxSizing: 'border-box'
      }
    };
    const rect = templateRef.current.getBoundingClientRect();

    toPng(templateRef.current, {
      cacheBust: true,
      width: 320,
      height: 440
    })
      .then((dataUrl) => {
        console.log(templateRef.current)
        console.log(100051, dataUrl)
        setThumbnailUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Oops, algo salió mal!', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
      {/* Área de renderizado del HTML. 
        Usamos `dangerouslySetInnerHTML` porque el HTML es una cadena de texto.
        La hacemos invisible pero accesible para que la librería pueda leerla.
      */}
      <div
        ref={templateRef}
        style={{ position: 'absolute', bottom: '0', left: '0', width: '320px', height: '440px', pointerEvents: 'none', opacity: 100 }}
        dangerouslySetInnerHTML={{ __html: emailTemplateHtml }}
      />

      <div>
        <h2>Generador de Miniaturas</h2>
        <p>Haz clic en el botón para generar una vista previa de la plantilla de correo.</p>
        <button className='bg-blue-500 text-white px-4 py-2 rounded' onClick={handleGenerateThumbnail} disabled={isLoading}>
          {isLoading ? 'Generando...' : 'Generar Thumbnail'}
        </button>
      </div>

      <div>
        <h3>Resultado:</h3>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Vista previa del correo"
            style={{ border: '2px solid #ccc', borderRadius: '8px' }}
          />
        ) : (
          <div style={{
            width: '320px',
            height: '440px',
            border: '2px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            La vista previa aparecerá aquí
          </div>
        )}
      </div>
    </div>
  );
}

