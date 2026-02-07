import React, { useEffect, useState } from 'react';
import { Arbol, Piano, Dj, Arbol2 } from './icons';
import SvgExample from '../public/svgs/question.svg';

import SvgWrapper from './SvgWrapper';

const SvgAutoScaleExample: React.FC = () => {
  const [targetSize, setTargetSize] = useState({ width: 100, height: 100 });

  useEffect(() => {
    console.log('targetSize', targetSize)
  }, [targetSize])


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Escalado Automático con ViewBox</h2>

      {/* Debug del SVG importado */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Debug: SVG Importado</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">SVG Original (100x100)</h4>
            <SvgExample width={100} height={100} />
          </div>
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">SVG Escalado (50x50)</h4>
            <SvgExample width={50} height={50} />
          </div>
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">SVG con fill personalizado</h4>
            <SvgExample width={80} height={80} fill="#EF4444" />
          </div>
        </div>
      </div>

      {/* Controles para cambiar el tamaño objetivo */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tamaño objetivo:</h3>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            Ancho:
            <input
              type="range"
              min="50"
              max="200"
              value={targetSize.width}
              onChange={(e) => setTargetSize(prev => ({ ...prev, width: Number(e.target.value) }))}
              className="w-32"
            />
            <span>{targetSize.width}px</span>
          </label>
          <label className="flex items-center gap-2">
            Alto:
            <input
              type="range"
              min="50"
              max="200"
              value={targetSize.height}
              onChange={(e) => setTargetSize(prev => ({ ...prev, height: Number(e.target.value) }))}
              className="w-32"
            />
            <span>{targetSize.height}px</span>
          </label>
        </div>
      </div>

      {/* Ejemplo 1: Escalado automático */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Escalado automático (mantiene proporción)</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="#3B82F6"
            >
              <SvgExample />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="#3B82F6"
              stroke="none"
              strokeWidth={0}
            >
              <Arbol />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="none"
            >
              <Arbol2 />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="#EF4444"
            >
              <Piano />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="#10B981"
            >
              <Dj />
            </SvgWrapper>
          </div>
        </div>
      </div>

      {/* Ejemplo 2: SVG importado con SvgWrapper */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. SVG Importado con SvgWrapper</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">AutoScale activado</h4>
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              autoScale={true}
              targetSize={targetSize}
              fill="#8B5CF6"
            >
              <SvgExample />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">Sin AutoScale (tamaño fijo)</h4>
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              fill="#F59E0B"
            >
              <SvgExample />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <h4 className="font-medium mb-2">Con transform manual</h4>
            <SvgWrapper
              width={targetSize.width}
              height={targetSize.height}
              transform="scale(0.5) rotate(45deg)"
              fill="#EC4899"
            >
              <SvgExample />
            </SvgWrapper>
          </div>
        </div>
      </div>

      {/* Ejemplo 3: Comparación con escalado manual */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">3. Comparación: Automático vs Manual</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Automático (viewBox)</h4>
            <div className="border-2 border-blue-300 p-2">
              <SvgWrapper
                width={120}
                height={80}
                autoScale={true}
                targetSize={{ width: 120, height: 80 }}
                fill="#3B82F6"
              >
                <SvgExample />
              </SvgWrapper>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Manual (scale fijo)</h4>
            <div className="border-2 border-red-300 p-2">
              <SvgWrapper
                width={120}
                height={80}
                transform="scale(0.5)"
                fill="#EF4444"
              >
                <SvgExample />
              </SvgWrapper>
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplo 4: Diferentes tamaños */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">4. Diferentes tamaños con escalado automático</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={60}
              height={60}
              autoScale={true}
              targetSize={{ width: 60, height: 60 }}
              fill="#8B5CF6"
            >
              <Arbol />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={100}
              height={60}
              autoScale={true}
              targetSize={{ width: 100, height: 60 }}
              fill="#F59E0B"
            >
              <Piano />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={80}
              height={100}
              autoScale={true}
              targetSize={{ width: 80, height: 100 }}
              fill="#EC4899"
            >
              <Dj />
            </SvgWrapper>
          </div>
        </div>
      </div>

      {/* Ejemplo 5: Con propiedades adicionales */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">5. Escalado automático con propiedades adicionales</h3>
        <div className="flex gap-4">
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={80}
              height={80}
              autoScale={true}
              targetSize={{ width: 80, height: 80 }}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth={2}
              opacity={0.8}
            >
              <Arbol />
            </SvgWrapper>
          </div>
          <div className="border-2 border-gray-300 p-2">
            <SvgWrapper
              width={80}
              height={80}
              autoScale={true}
              targetSize={{ width: 80, height: 80 }}
              fill="#EF4444"
              stroke="#991B1B"
              strokeWidth={1}
              strokeDasharray="3,3"
            >
              <Piano />
            </SvgWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SvgAutoScaleExample; 