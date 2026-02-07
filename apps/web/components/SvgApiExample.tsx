import React, { useState, useCallback } from 'react';
import SvgWrapper from './SvgWrapper';

const SvgApiExample: React.FC = () => {
  const [selectedUrl, setSelectedUrl] = useState('https://raw.githubusercontent.com/feathericons/feather/master/icons/heart.svg');
  const [customUrl, setCustomUrl] = useState('');

  const testUrls = [
    'https://raw.githubusercontent.com/feathericons/feather/master/icons/heart.svg',
    'https://raw.githubusercontent.com/feathericons/feather/master/icons/star.svg',
    'https://raw.githubusercontent.com/feathericons/feather/master/icons/home.svg',
    'https://raw.githubusercontent.com/feathericons/feather/master/icons/user.svg',
    'https://raw.githubusercontent.com/feathericons/feather/master/icons/settings.svg'
  ];

  const handleLoad = useCallback((content: string) => {
    console.log('SVG cargado desde API:', content.substring(0, 100) + '...');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Error cargando SVG:', error);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">SVGs desde API - Solución Simplificada</h2>

      {/* Información sobre la nueva solución */}
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">🎯 Nueva Solución con API</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>• <strong>Sin CORS:</strong> Tu API descarga el SVG sin restricciones</p>
          <p>• <strong>Más simple:</strong> Un solo endpoint, una sola estrategia</p>
          <p>• <strong>Mejor control:</strong> Validación, cache, rate limiting en servidor</p>
          <p>• <strong>Más seguro:</strong> Filtrado de URLs, validación de contenido</p>
          <p>• <strong>Mejor performance:</strong> Cache en servidor, optimización automática</p>
        </div>
      </div>

      {/* Input para URL personalizada */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">URL personalizada:</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://example.com/icon.svg"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={() => setSelectedUrl(customUrl)}
            disabled={!customUrl}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Cargar
          </button>
        </div>
      </div>

      {/* Selector de URL de prueba */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">URL de prueba:</h3>
        <select
          value={selectedUrl}
          onChange={(e) => setSelectedUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          {testUrls.map((url, index) => (
            <option key={index} value={url}>
              {url.split('/').pop()?.replace('.svg', '')} - {url}
            </option>
          ))}
        </select>
      </div>

      {/* Ejemplo básico */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Carga básica desde API</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-4">
            <h4 className="font-medium mb-2">SvgFromApi</h4>
            <div className="h-32 flex items-center justify-center">
              {/* <SvgFromApi
                url={selectedUrl}
                width={60}
                height={60}
                fill="#EF4444"
                onLoad={handleLoad}
                onError={handleError}
              /> */}
            </div>
          </div>
          <div className="border-2 border-gray-300 p-4">
            <h4 className="font-medium mb-2">Con SvgWrapper</h4>
            <div className="h-32 flex items-center justify-center">
              {/* <SvgWrapper
                width={60}
                height={60}
                autoScale={true}
                targetSize={{ width: 60, height: 60 }}
                fill="#3B82F6"
              >
                <SvgFromApi
                  url={selectedUrl}
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </SvgWrapper> */}
            </div>
          </div>
        </div>
      </div>

      {/* Prueba de múltiples URLs */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. Prueba de múltiples URLs</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {testUrls.map((url, index) => (
            <div key={`test-${url}`} className="border-2 border-gray-300 p-4 text-center">
              {/* <SvgFromApi
                url={url}
                width={40}
                height={40}
                fill="#6B7280"
                className="mx-auto mb-2"
                onLoad={(content) => {
                  console.log(`${url.split('/').pop()}: ${(content.length / 1024).toFixed(1)}KB`);
                }}
              /> */}
              <p className="text-xs text-gray-600">
                {url.split('/').pop()?.replace('.svg', '')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparación con la solución anterior */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">🔄 Comparación de Soluciones:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-yellow-700 mb-1">Solución Anterior (Frontend):</h5>
            <ul className="text-yellow-600 space-y-1">
              <li>• 4 estrategias de carga</li>
              <li>• Manejo complejo de CORS</li>
              <li>• Múltiples componentes</li>
              <li>• Lógica compleja en cliente</li>
              <li>• Posibles bucles infinitos</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-700 mb-1">Nueva Solución (API):</h5>
            <ul className="text-green-600 space-y-1">
              <li>• 1 endpoint simple</li>
              <li>• Sin problemas de CORS</li>
              <li>• 1 componente simple</li>
              <li>• Lógica en servidor</li>
              <li>• Sin bucles infinitos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uso en tu aplicación */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded">
        <h4 className="font-semibold text-purple-800 mb-2">💡 Uso en tu aplicación:</h4>
        <div className="text-sm text-purple-700 space-y-2">
          <p><strong>1. Reemplazar SvgFromUrl:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {`// Antes
<SvgFromUrl url="https://example.com/icon.svg" />

// Ahora
<SvgFromApi url="https://example.com/icon.svg" />`}
          </pre>

          <p><strong>2. En BlockPanelElements.tsx:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {`// Reemplazar loadSvgFromUrl por:
const apiUrl = \`/api/fetch-svg?url=\${encodeURIComponent(svgUrl)}\`;
const response = await fetch(apiUrl);
const svgContent = await response.text();`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SvgApiExample; 