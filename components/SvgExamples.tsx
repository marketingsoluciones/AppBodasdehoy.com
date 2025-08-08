import React from 'react';
import { Arbol, Piano, Dj, Arbol2 } from './icons';
import SvgWrapper from './SvgWrapper';

const SvgExamples: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Ejemplos de SvgWrapper</h2>

      {/* Ejemplo 1: Cambio de color de relleno */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Cambio de color de relleno (fill)</h3>
        <div className="flex gap-4">
          <SvgWrapper width={40} height={40} fill="#3B82F6">
            <Arbol />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} fill="#EF4444">
            <Arbol />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} fill="#10B981">
            <Arbol />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 2: Stroke y stroke-width */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. Stroke y stroke-width</h3>
        <div className="flex gap-4">
          <SvgWrapper width={40} height={40} stroke="#1F2937" strokeWidth={2}>
            <Piano />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} stroke="#DC2626" strokeWidth={4}>
            <Piano />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} stroke="#059669" strokeWidth={6}>
            <Piano />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 3: Opacidad */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">3. Opacidad</h3>
        <div className="flex gap-4">
          <SvgWrapper width={40} height={40} opacity={1}>
            <Dj />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} opacity={0.7}>
            <Dj />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} opacity={0.4}>
            <Dj />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} opacity={0.1}>
            <Dj />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 4: Stroke-dasharray (líneas punteadas) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">4. Stroke-dasharray (líneas punteadas)</h3>
        <div className="flex gap-4">
          <SvgWrapper width={40} height={40} stroke="#1F2937" strokeWidth={2} strokeDasharray="5,5">
            <Arbol2 />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} stroke="#DC2626" strokeWidth={2} strokeDasharray="10,5">
            <Arbol2 />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} stroke="#059669" strokeWidth={2} strokeDasharray="2,8">
            <Arbol2 />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 5: Transform (rotación, escala, etc.) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">5. Transform (rotación, escala)</h3>
        <div className="flex gap-4">
          <SvgWrapper width={40} height={40} transform="rotate(0)">
            <Arbol />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} transform="rotate(45)">
            <Arbol />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} transform="rotate(90)">
            <Arbol />
          </SvgWrapper>
          <SvgWrapper width={40} height={40} transform="scale(1.2)">
            <Arbol />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 6: Combinación de propiedades */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">6. Combinación de propiedades</h3>
        <div className="flex gap-4">
          <SvgWrapper
            width={40}
            height={40}
            fill="#8B5CF6"
            stroke="#4C1D95"
            strokeWidth={2}
            opacity={0.8}
            transform="rotate(15)"
          >
            <Piano />
          </SvgWrapper>
          <SvgWrapper
            width={40}
            height={40}
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth={3}
            strokeDasharray="3,3"
            transform="scale(0.8)"
          >
            <Dj />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 7: Stroke-linecap y stroke-linejoin */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">7. Stroke-linecap y stroke-linejoin</h3>
        <div className="flex gap-4">
          <SvgWrapper
            width={40}
            height={40}
            stroke="#1F2937"
            strokeWidth={4}
            strokeLinecap="butt"
          >
            <Arbol2 />
          </SvgWrapper>
          <SvgWrapper
            width={40}
            height={40}
            stroke="#DC2626"
            strokeWidth={4}
            strokeLinecap="round"
          >
            <Arbol2 />
          </SvgWrapper>
          <SvgWrapper
            width={40}
            height={40}
            stroke="#059669"
            strokeWidth={4}
            strokeLinecap="square"
          >
            <Arbol2 />
          </SvgWrapper>
        </div>
      </div>

      {/* Ejemplo 8: Opacidades separadas */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">8. Opacidades separadas (fill-opacity, stroke-opacity)</h3>
        <div className="flex gap-4">
          <SvgWrapper
            width={40}
            height={40}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            fillOpacity={0.3}
            strokeOpacity={1}
          >
            <Piano />
          </SvgWrapper>
          <SvgWrapper
            width={40}
            height={40}
            fill="#EF4444"
            stroke="#991B1B"
            strokeWidth={2}
            fillOpacity={1}
            strokeOpacity={0.5}
          >
            <Dj />
          </SvgWrapper>
        </div>
      </div>
    </div>
  );
};

export default SvgExamples; 