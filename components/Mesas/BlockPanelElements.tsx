import { Arbol, Arbol2, Dj, Group83, Layer2, Piano, PlusIcon, } from "../icons";
import { FC, useState } from "react";
import BlockDefault from "./BlockDefault";
import DragTable from "./DragTable"
import SvgFromString from '../SvgFromString';

import { getSvgOptimizationInfo, SVG_SIZE_LIMITS } from '../../utils/svgSizeUtils';

interface propsBlockPanelElements {

}

export interface ElementItem {
  icon: React.ReactElement;
  title: string;
  tipo: string;
  size?: { width: number; height: number };
}

export const ListElements: ElementItem[] = [
  { icon: <Arbol className="" />, title: "arbol", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Arbol2 className="" />, title: "arbol2", tipo: "element", size: { width: 60, height: 120 } },
  { icon: <Dj className="" />, title: "dj", tipo: "element", size: { width: 140, height: 110 } },
  { icon: <Layer2 className="" />, title: "layer2", tipo: "element", size: { width: 280, height: 250 } },
  { icon: <Piano className="" />, title: "piano", tipo: "element", size: { width: 120, height: 120 } },
];

const BlockPanelElements: FC<propsBlockPanelElements> = () => {
  const [listElements, setListElements] = useState<ElementItem[]>(ListElements);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [svgUrl, setSvgUrl] = useState("");
  const [svgTitle, setSvgTitle] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const validation = validateSvgSize(file);
      if (!validation.isValid) {
        alert(validation.message);
        return;
      }
      if (validation.message) {
        console.warn(validation.message);
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const svgContent = e.target?.result as string;
          const optimizationInfo = getSvgOptimizationInfo(svgContent);
          if (optimizationInfo.canOptimize) {
            console.log('💡 Sugerencias de optimización:', optimizationInfo.optimizationTips);
          }
          const newElement: ElementItem = {
            icon: <SvgFromString svgString={svgContent} className="relative w-max" />,
            title: file.name.replace('.svg', ''),
            tipo: "element",
            size: { width: 60, height: 60 }
          };
          setListElements(prev => [...prev, newElement]);
          setShowModal(false);
          setIsLoading(false);
        } catch (error) {
          console.error('Error al procesar el SVG:', error);
          alert("Error al procesar el archivo SVG");
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        alert("Error al leer el archivo");
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      alert("Por favor selecciona un archivo SVG válido");
    }
  };

  const handleUrlSubmit = async () => {
    if (svgUrl && svgTitle) {
      setIsLoading(true);
      try {
        console.log('Intentando cargar SVG desde:', svgUrl);

        // Usar la nueva API para descargar el SVG
        const apiUrl = `/api/fetch-svg?url=${encodeURIComponent(svgUrl)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const svgContent = await response.text();
        console.log('SVG cargado exitosamente desde API:', (svgContent.length / 1024).toFixed(1) + 'KB');

        // Mostrar información de optimización
        const optimizationInfo = getSvgOptimizationInfo(svgContent);
        if (optimizationInfo.canOptimize) {
          console.log('💡 Sugerencias de optimización:', optimizationInfo.optimizationTips);
        }

        const newElement: ElementItem = {
          icon: <SvgFromString svgString={svgContent} className="relative w-max" />,
          title: svgTitle,
          tipo: "element",
          size: { width: 60, height: 60 }
        };

        setListElements(prev => [...prev, newElement]);
        setShowModal(false);
        setSvgUrl("");
        setSvgTitle("");
        setIsLoading(false);

      } catch (error) {
        console.error('Error completo al cargar SVG:', error);
        alert(`Error al cargar el SVG: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsLoading(false);
      }
    } else {
      alert("Por favor completa todos los campos");
    }
  };

  const validateSvgSize = (file: File) => {
    const sizeInKB = file.size / 1024;
    const maxSizeKB = SVG_SIZE_LIMITS.MAX_FILE_SIZE / 1024;

    if (file.size > SVG_SIZE_LIMITS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        message: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeKB}KB. Tamaño del archivo: ${sizeInKB.toFixed(1)}KB`
      };
    }

    if (file.size > SVG_SIZE_LIMITS.RECOMMENDED_SIZE) {
      return {
        isValid: true,
        message: `El archivo es grande (${sizeInKB.toFixed(1)}KB). Considera optimizarlo para mejor rendimiento.`
      };
    }

    return { isValid: true };
  };

  return (
    <>
      {/* Modal para cargar SVG */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar SVG</h3>

            {/* Información sobre límites de tamaño */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Límites de tamaño:</strong><br />
                • Máximo: {SVG_SIZE_LIMITS.MAX_FILE_SIZE / 1024}KB<br />
                • Recomendado: {SVG_SIZE_LIMITS.RECOMMENDED_SIZE / 1024}KB o menos
              </p>
            </div>

            {/* Opción 1: Cargar desde archivo */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cargar desde archivo:</label>
              <input
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>

            {/* Opción 2: Cargar desde URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cargar desde URL:</label>
              <input
                type="text"
                placeholder="URL del SVG (ej: https://ejemplo.com/icono.svg)"
                value={svgUrl}
                onChange={(e) => setSvgUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
                disabled={isLoading}
              />
              <input
                type="text"
                placeholder="Nombre del elemento"
                value={svgTitle}
                onChange={(e) => setSvgTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={isLoading}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isLoading}
                className="w-full mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Cargando...' : 'Agregar desde URL'}
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              disabled={isLoading}
              className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div id="listTables" className="w-full h-full">
        <BlockDefault listaLength={listElements.length}>
          {listElements.map((item, idx) => (
            <DragTable key={idx} item={item} />
          ))}
          <div id="added-svg" onClick={() => { setShowModal(true) }} className="w-20 h-16 static">
            <span className="w-full h-full flex items-center ">
              <div className="w-full h-full p-2 flex-col justify-center items-center *cursor-pointer relative">
                <div className="w-full h-full flex transform hover:scale-105 transition justify-center items-center relative">
                  <div className="js-dragDefault w-full h-10 flex justify-center items-center">
                    <Group83 className="relative w-max" />
                    <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
                  </div>
                </div>
              </div>
            </span>
            <style>{`
              .listTables {
                touch - action: none;
                user-select: none;
              }
            `}</style>
          </div>
        </BlockDefault>
      </div>
    </>
  );
};

export default BlockPanelElements;